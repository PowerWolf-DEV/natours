import User from './../models/userModel.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import AppError from './../utils/appError.js';
import Email from './../utils/email.js';

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// generate random sycret key
// import crypto from 'crypto';
// console.log(crypto.randomBytes(64).toString('hex'));

export const signup = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });

    const url = `${req.protocol}://${req.get('host')}/me`;

    await new Email(newUser, url).sendWelcome();

    createSendToken(newUser, 201, res);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Check if email & pasword exist
    if (!email || !password) {
      return next(new AppError('Please provide email and password!', 400));
    }
    // 2. Check if the user exist & password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }
    // 3. If everything ok, send tokent to client
    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

export const loguout = (req, res) => {
  res.clearCookie('jwt');
  res.status(200).json({ status: 'success' });
};

export const protect = async (req, res, next) => {
  try {
    // 1. Get the token
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }
    // 2. Verification of the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 3. Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token does no longer exist', 401));
    }
    // 4. Check  if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(new AppError('User recently changed password. Please log in again!', 401));
    }

    // Grand access to protected route
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  } catch (err) {
    next(err);
  }
};

// Only for rendered pages, no errors!
export const isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt === null) {
      return next();
    }
    if (req.cookies.jwt) {
      // 1. Get the token
      const token = req.cookies.jwt;

      // 2. Verification of the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      // 4. Check  if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // There is a logged in user
      // ** In order to get access in pug template to variable use res.locals.varName = value
      res.locals.user = currentUser;
      return next();
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};

export const forgotPassword = async (req, res, next) => {
  try {
    // 1. Get user based on posted email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new AppError('There is no user with that email address', 404));
    }

    // 2. Gererate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
      const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

      // 3. Send it to user's email
      await new Email(user, resetURL).sendPasswordReset();

      res.status(200).json({
        status: 'success',
        message: 'Token sent to email!',
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new AppError('There was an error sending email. Try again later!', 500));
    }
  } catch (err) {
    next(err);
  }
};
export const resetPassword = async (req, res, next) => {
  try {
    // 1. Get user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });

    // 2. If token has not expired and there is a user - set new password
    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();
    // 3. Update changedPasswordAt property for the user(done in model.pre('save'))

    // 4. Log the user in, send JWT token
    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, newPasswordConfirm } = req.body;
    // 1. Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2. Check if posted current password is correct
    if (!(await user.correctPassword(currentPassword, user.password))) {
      return next(new AppError('Your current password is incorrect', 401));
    }
    // 3. If so, update password
    user.password = newPassword;
    user.passwordConfirm = newPasswordConfirm;
    await user.save();

    // 4. Log user in, send JWT
    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};
