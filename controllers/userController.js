import User from './../models/userModel.js';
import * as factory from './../controllers/handlerFactory.js';
import AppError from './../utils/appError.js';

import multer from 'multer';
import sharp from 'sharp';

// Uploading images
// Storage settings(save data on the server)
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // user-id-timestamp.extension
//     const extension = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${extension}`);
//   },
// });

// save data in memory as Buffer object
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

// upload single file
export const uploadUserPhoto = upload.single('photo');

// middleware for processing user photo
export const resizeUserPhoto = async (req, res, next) => {
  try {
    if (!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer).resize(500, 500).toFormat('jpeg').jpeg({ quality: 90 }).toFile(`public/img/users/${req.file.filename}`);

    next();
  } catch (err) {
    next(err);
  }
};

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(element => {
    if (allowedFields.includes(element)) newObj[element] = obj[element];
  });
  // console.log(newObj);
  return newObj;
};

export const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

export const updateMe = async (req, res, next) => {
  try {
    // console.log(req.file);
    // console.log(req.body);

    // 1. Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
      return next(new AppError('This route is not for password updates. Please use /updateMyPassword!', 400));
    }
    // 2. Filtered out unwanted fields names that are not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');
    if (req.file) filteredBody.photo = req.file.filename;
    // 3. Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true });
    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllUsers = factory.getAll(User);
export const getUser = factory.getOne(User);
// For testing only(use signup in production)
export const createUser = factory.createOne(User);
// Do NOT update passwords with this
export const updateUser = factory.updateOne(User);
export const deleteUser = factory.deleteOne(User);
