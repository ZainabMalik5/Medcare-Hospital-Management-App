const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const doctorModel = require("../models/doctorModel");
const appointmentModel = require("../models/appointmentModel");
const moment = require("moment");
let nodemailer = require("nodemailer");
//register callback
const registerController = async (req, res) => {
  try {
    const exisitingUser = await userModel.findOne({ email: req.body.email });
    if (exisitingUser) {
      return res
        .status(200)
        .send({ message: "User Already Exists", success: false });
    }
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    req.body.password = hashedPassword;
    const newUser = new userModel(req.body);
    await newUser.save();
    res.status(201).send({ message: "Registered Sucessfully", success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: `Register Controller ${error.message}`,
    });
  }
};

// login callback
const loginController = async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(200)
        .send({ message: "User not found", success: false });
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res
        .status(200)
        .send({ message: "Invalid Email or Password", success: false });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.status(200).send({ message: "Login Success", success: true, token });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: `Error in Login CTRL ${error.message}` });
  }
};

const authController = async (req, res) => {
  try {
    const user = await userModel.findById({ _id: req.body.userId });
    user.password = undefined;
    if (!user) {
      return res.status(200).send({
        message: "user not found",
        success: false,
      });
    } else {
      res.status(200).send({
        success: true,
        data: user,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "auth error",
      success: false,
      error,
    });
  }
};
const applyDoctorController = async (req, res) => {
  try {
    const newDoctor = await doctorModel({ ...req.body, status: "pending" });
    await newDoctor.save();
    const adminUser = await userModel.findOne({ isAdmin: true });
    const notification = adminUser.notification;
    notification.push({
      type: "apply-doctor-request",
      message: `${newDoctor.firstName} ${newDoctor.lastName} has applied for a Doctor position`,
      data: {
        doctorId: newDoctor._id,
        name: newDoctor.firstName + " " + newDoctor.lastName,
        onClickPath: "/admin/doctors",
      },
    });
    await userModel.findByIdAndUpdate(adminUser._id, { notification });
    res.status(201).send({
      success: true,
      message: "Applied Successfully for Doctor",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error While Applying For Doctotr",
    });
  }
};
const getAllNotificationController = async (req, res) => {
  try {
    const user = await userModel.findOne({ _id: req.body.userId });
    const seennotification = user.seennotification;
    const notification = user.notification;
    seennotification.push(...notification);
    user.notification = [];
    user.seennotification = notification;
    const updatedUser = await user.save();
    res.status(200).send({
      success: true,
      message: "all notification marked as read",
      data: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error in notification",
      success: false,
      error,
    });
  }
};
const deleteAllNotificationController = async (req, res) => {
  try {
    const user = await userModel.findOne({ _id: req.body.userId });
    user.notification = [];
    user.seennotification = [];
    const updatedUser = await user.save();
    updatedUser.password = undefined;
    res.status(200).send({
      success: true,
      message: "Notifications deleted successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "unable to delete all notifications",
      error,
    });
  }
};
const getAllDocotrsController = async (_req, res) => {
  try {
    const doctors = await doctorModel.find({ status: "approved" });

    return res.status(200).send({
      success: true,
      message: "Doctors Lists Fetched Successfully",
      data: doctors,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).send({
      success: false,
      error,
      message: "Error While Fetching Doctors",
    });
  }
};
const bookeAppointmnetController = async (req, res) => {
  try {
    req.body.status = "pending";
    const doctor= await doctorModel.findById(req.body.doctorId);

    const user = await userModel.findById(doctor.userId);

    if (user) {
      user.notification.push({
        type: "New-appointment-request",
        message: `A new appointment request from ${req.body.userInfo}`,
        onCLickPath: "/user/appointments",
      });
      await user.save();
    }

    const newAppointment = new appointmentModel(req.body);
    await newAppointment.save();

    res.status(200).send({
      success: true,
      message: "Appointment booked succesfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).send({
      success: false,
      error,
      message: "Error while Booking Appointment",
    });
  }
};

const bookingAvailabilityController = async (req, res) => {
  try {

    const date = req.body.date;

    const [inputHours, inputMinutes] = req.body.time.split(":");

    const originalTime = new Date();
    originalTime.setHours(Number(inputHours));
    originalTime.setMinutes(Number(inputMinutes));

    const oneHourLater = new Date(originalTime);
    oneHourLater.setHours(originalTime.getHours() + 1);

    const oneHourEarlier = new Date(originalTime);
    oneHourEarlier.setHours(originalTime.getHours() - 1);

    const formatTime = (date) => {
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    };

    const toTime = formatTime(oneHourLater);
    const fromTime = formatTime(oneHourEarlier);

    const doctorId = req.body.doctorId;

    const appointments = await appointmentModel.find({
      doctorId,
      date,
      status:"pending"||"approved",
      time: {
        $gte: fromTime,
        $lte: toTime,
      },
    });
    if (appointments.length > 0) {
      return res.status(200).send({
        message: "Appointments not available at this time",
        success: false,
      });
    } else {
      return res.status(200).send({
        success: true,
        message: "Appointments available",
      });
    }
  } catch (error) {
    console.log(error);

    res.status(500).send({
      success: false,
      error,
      message: "Error In Booking",
    });
  }
};
const userAppointmentsController = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({
      userId: req.body.userId,
    });
    res.status(200).send({
      success: true,
      message: "Users Appointments Fetched Successfully",
      data: appointments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error In User Appointments",
    });
  }
};



module.exports = {loginController, registerController, authController,applyDoctorController,
  getAllNotificationController,deleteAllNotificationController,getAllDocotrsController,bookeAppointmnetController,
  bookingAvailabilityController,userAppointmentsController, };