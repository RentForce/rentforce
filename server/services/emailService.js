const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER ,
    pass: process.env.EMAIL_PASS ,
  },
});

const sendBookingRequestEmail = async (guestEmail, hostEmail, houseDetails, price) => {
  // Email to host
  const hostMailOptions = {
    from: process.env.EMAIL_USER ,
    to: hostEmail,
    subject: 'New Booking Request',
    html: `
      <h2>New Booking Request</h2>
      <p>You have received a new booking request for your property.</p>
      
      <h3>Booking Details:</h3>
      <ul>
        <li><strong>Property:</strong> ${houseDetails.title}</li>
        <li><strong>Location:</strong> ${houseDetails.location}</li>
        <li><strong>Check-in:</strong> ${new Date(houseDetails.checkIn).toLocaleDateString()}</li>
        <li><strong>Check-out:</strong> ${new Date(houseDetails.checkOut).toLocaleDateString()}</li>
        <li><strong>Number of Guests:</strong> ${houseDetails.guests}</li>
        <li><strong>Total Price:</strong> $${price}</li>
      </ul>

      <p>Please review and respond to this booking request.</p>
    `
  };

  // Email to guest
  const guestMailOptions = {
    from: process.env.EMAIL_USER ,
    to: guestEmail,
    subject: 'Booking Request Confirmation',
    html: `
      <h2>Booking Request Sent</h2>
      <p>Your booking request has been sent to the host. You will be notified once they respond.</p>
      
      <h3>Booking Details:</h3>
      <ul>
        <li><strong>Property:</strong> ${houseDetails.title}</li>
        <li><strong>Location:</strong> ${houseDetails.location}</li>
        <li><strong>Check-in:</strong> ${new Date(houseDetails.checkIn).toLocaleDateString()}</li>
        <li><strong>Check-out:</strong> ${new Date(houseDetails.checkOut).toLocaleDateString()}</li>
        <li><strong>Number of Guests:</strong> ${houseDetails.guests}</li>
        <li><strong>Total Price:</strong> $${price}</li>
      </ul>
    `
  };

  try {
    await transporter.sendMail(hostMailOptions);
    await transporter.sendMail(guestMailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending emails:', error);
    throw error;
  }
};

module.exports = {
  sendBookingRequestEmail
};
