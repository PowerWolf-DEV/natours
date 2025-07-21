import AppError from './../utils/appError.js';
import APIFeatures from './../utils/apiFeatures.js';

export const deleteOne = Model => {
  return async (req, res, next) => {
    try {
      const doc = await Model.findByIdAndDelete(req.params.id);

      if (!doc) {
        return next(new AppError('No document found with that ID', 404));
      }

      res.status(204).json({
        status: 'success',
        data: {
          tour: null,
        },
      });
    } catch (err) {
      next(err);
    }
  };
};

export const updateOne = Model => {
  return async (req, res, next) => {
    try {
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!doc) {
        return next(new AppError('No document found with that ID', 404));
      }

      res.status(200).json({
        status: 'success',
        data: {
          data: doc,
        },
      });
    } catch (err) {
      next(err);
    }
  };
};

export const createOne = Model => {
  return async (req, res, next) => {
    try {
      const doc = await Model.create(req.body);

      res.status(201).json({
        status: 'success',
        data: {
          data: doc,
        },
      });
    } catch (err) {
      next(err);
    }
  };
};

export const getOne = (Model, populateOptions) => {
  return async (req, res, next) => {
    try {
      let query = Model.findById(req.params.id);
      if (populateOptions) query = query.populate(populateOptions);
      const doc = await query;

      if (!doc) {
        return next(new AppError('No document found with that ID', 404));
      }

      res.status(200).json({
        status: 'success',
        data: {
          data: doc,
        },
      });
    } catch (err) {
      next(err);
    }
  };
};

export const getAll = Model => {
  return async (req, res, next) => {
    try {
      // To allow for nested get reviews on tour
      let filter = {};
      if (req.params.tourId) filter = { tour: req.params.tourId };
      const features = new APIFeatures(Model.find(filter), req.query).filter().sort().limitFields().paginate();

      // Execute the query
      const doc = await features.query; // .explain()

      // Send response
      res.status(200).json({
        status: 'success',
        results: doc.length,
        data: {
          data: doc,
        },
      });
    } catch (err) {
      next(err);
    }
  };
};
