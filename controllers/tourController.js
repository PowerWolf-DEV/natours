import Tour from './../models/tourModel.js';
import * as factory from './../controllers/handlerFactory.js';
import AppError from '../utils/appError.js';
import multer from 'multer';
import sharp from 'sharp';

// import { randomUUID } from 'node:crypto';

const multerStorage = multer.memoryStorage();

// Filter settings
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// combine single and multiple uploads
export const uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

export const resizeTourImages = async (req, res, next) => {
  try {
    // console.log(req.files);

    const promises = [];

    // 1. Process cover image
    if (req.files.imageCover) {
      // create a name for the image
      req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
      promises.push(
        sharp(req.files.imageCover[0].buffer)
          .resize(2000, 1333)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(`public/img/tours/${req.body.imageCover}`)
      );
    }
    // 2. Process images(array)
    if (req.files.images) {
      req.body.images = [];

      req.files.images.forEach((image, i) => {
        // create file name for evey image
        const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
        // save to array
        req.body.images.push(filename);

        promises.push(sharp(image.buffer).resize(2000, 1333).toFormat('jpeg').jpeg({ quality: 90 }).toFile(`public/img/tours/${filename}`));
      });
    }

    // execute all promises here
    await Promise.all(promises);
    // console.log(req.body);

    next();
  } catch (err) {
    next(err);
  }
};

// upload single file
// upload.single('image') -  produce req.file

// upload multiple images
// upload.array('images', 5) - produce req.files

export const aliasTopTours = (req, res, next) => {
  // console.log(req.url);
  req.url = '/?sort=-ratingsAverage,price&fields=ratingsAverage,price,name,difficulty,summary&limit=5';

  next();
};

export const getAllTours = factory.getAll(Tour);
export const getTour = factory.getOne(Tour, { path: 'reviews' });
export const createTour = factory.createOne(Tour);
export const updateTour = factory.updateOne(Tour);
export const deleteTour = factory.deleteOne(Tour);

export const getTourStats = async (req, res, next) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: { $toUpper: '$difficulty' },
          // _id: '$difficulty',
          // _id: '$ratingsAverage',
          numTours: { $sum: 1 },
          numRatings: {
            $sum: '$ratingsQuantity',
          },
          agvRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
      // {
      //   $match: { _id: { $ne: 'EASY' } },
      // },
    ]);

    res.status(200).json({
      status: 'success',
      data: { stats },
    });
  } catch (err) {
    next(err);
  }
};

export const getMonthlyPlan = async (req, res, next) => {
  try {
    const year = +req.params.year; // 2021
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numToursStarts: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $sort: { numToursStarts: -1 },
      },
      {
        $limit: 12,
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: { plan },
    });
  } catch (err) {
    next(err);
  }
};

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/-40,45/unit/mi
export const getToursWithin = async (req, res, next) => {
  try {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng) {
      return next(new AppError('Please provide latitude and longitude in format lat,lng.', 400));
    }

    // console.log(distance, lat, lng, unit, radius);

    const tours = await Tour.find({ startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } });

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        data: tours,
      },
    });
  } catch (err) {
    next(err);
  }
};

// '/distances/:latlng/unit/:unit'
export const getDistances = async (req, res, next) => {
  try {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    if (!lat || !lng) {
      return next(new AppError('Please provide latitude and longitude in format lat,lng.', 400));
    }

    // console.log(lat, lng, unit);

    const distances = await Tour.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [+lng, +lat],
          },
          distanceField: 'distance',
          distanceMultiplier: multiplier, // convert metres into kilometers or miles
        },
      },
      {
        $project: {
          distance: 1,
          name: 1,
        },
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        data: distances,
      },
    });
  } catch (err) {
    next(err);
  }
};

// code before refactoring

// const catchAsync = fn => {
//   return (req, res, next) => {
//     fn(req, res, next).catch(next);
//   };
// };

// export const getTour = async (req, res, next) => {
//   try {
//     const id = req.params.id;

//     const tour = await Tour.findById(id).populate('reviews');
//     // .populate({
//     //   path: 'guides',
//     //   select: '-__v -passwordChangedAt',
//     // });
//     // Tour.findOne({_id: req.params.id})
//     if (!tour) {
//       return next(new AppError('No tour found with that ID', 404));
//     }

//     res.status(200).json({
//       status: 'success',
//       data: {
//         tour,
//       },
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// export const createTour = async (req, res, next) => {
//   try {
//     const newTour = await Tour.create(req.body);

//     res.status(201).json({
//       status: 'success',
//       data: {
//         tour: newTour,
//       },
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// export const updateTour = async (req, res, next) => {
//   try {
//     const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true,
//     });

//     if (!updatedTour) {
//       return next(new AppError('No tour found with that ID', 404));
//     }

//     res.status(200).json({
//       status: 'success',
//       data: {
//         tour: updatedTour,
//       },
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// export const deleteTour = async (req, res, next) => {
//   try {
//     const tour = await Tour.findByIdAndDelete(req.params.id);

//     if (!tour) {
//       return next(new AppError('No tour found with that ID', 404));
//     }

//     res.status(204).json({
//       status: 'success',
//       data: {
//         tour: null,
//       },
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// export const getAllTours = async (req, res, next) => {
//   try {
//     // console.log(req.query);
//     const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().paginate();

//     // Execute the query
//     const tours = await features.query;

//     // Send response
//     res.status(200).json({
//       status: 'success',
//       results: tours.length,
//       data: {
//         tours,
//       },
//     });
//   } catch (err) {
//     next(err);
//   }
// };
