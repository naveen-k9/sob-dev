const functions = require("firebase-functions");

const AWS = require("aws-sdk");
// const logger = require("firebase-functions/logger");
const axios = require("axios");

const ses = new AWS.SES({
  region: "ap-south-1", // e.g. "us-east-1"
  accessKeyId: "AKIAVKJPCA73KKQTKSMM",
  secretAccessKey: "v6FoEvr75wSdBzyz6CafsnACuMMGtpaERN9FdhCa",
});

const admin = require("firebase-admin");
const {Timestamp} = require("firebase-admin/firestore");
admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();
const crypto = require("crypto");
// const cors = require("cors")({ origin: true });
const { v4: uuidv4 } = require("uuid");
const OTP_TTL_MIN = 10;
const OTP_RATE_LIMIT_MIN = 1;
const MSG91_SENDER_ID = "ALMAHD";
const MSG91_TEMPLATE_ID = "68347646d6fc054442163222";
const MSG91_AUTHKEY = "451455AqbL4gJNR5cr68245bfbP1";
const API_KEY = "MISTERK9qwertyuiopmnbvfresygnydbfgdsd87(.";

function generateSecureOtpWithPhone(phone, length = 6) {
  // Use random salt to prevent deterministic behavior
  const salt = crypto.randomBytes(16).toString("hex");

  // Hash the phone number with salt to introduce uniqueness
  const hash = crypto
    .createHash("sha256")
    .update(phone + salt)
    .digest("hex");

  // Convert hash to integer and mod it for OTP range
  const otpInt = parseInt(hash.slice(0, 8), 16) % 10 ** length;

  // Pad to desired length
  return otpInt.toString().padStart(length, "0");
}

// OTP Handler - single function for send and verify
exports.otpHandler = functions.https.onRequest(async (req, res) => {
  const { action, phone, otp, kn } = req.body;

  if (!kn || kn !== API_KEY) {
    return res.status(403).json({ error: "Invalid Request" });
  }

  if (!action || !phone) {
    if (!phone || !otp)
      return res.status(400).send({ error: "Missing fields are required" });
  }

  const docRef = db.collection("otp_verification").doc(phone);
  const now = Date.now();

  if (action === "send") {
    // Rate limit check
    const existing = await docRef.get();
    if (existing.exists) {
      const lastSent =
        existing.data().timestamp?.toMillis?.() || existing.data().timestamp;
      if (now - lastSent < OTP_RATE_LIMIT_MIN * 60 * 1000) {
        res.send({
          "resource-exhausted": "Wait before requesting OTP again",
        });
      }
    }

    const generatedOtp = generateSecureOtpWithPhone(phone);

    // Send OTP via MSG91
    try {
      const otpResponse = await axios.post(
        "https://control.msg91.com/api/v5/flow",
        {
          template_id: MSG91_TEMPLATE_ID,
          sender_id: MSG91_SENDER_ID,
          short_url: "0",
          recipients: [
            {
              mobiles: phone,
              otp: generatedOtp,
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            authkey: MSG91_AUTHKEY,
          },
        }
      );
      // If MSG91 returns HTTP 202, treat as invalid mobile number
      if (otpResponse.status === 202) {
        return res.status(200).send({ success: false, error: "Invalid Mobile Number" });
      }
    } catch (err) {
      // MSG91 error responses may be in err.response.data
      if (err.response && err.response.status === 202) {
        return res.status(200).send({ success: false, error: "Invalid Mobile Number" });
      }
      console.error("MSG91 error:", err.response?.data || err.message);
      return res.status(500).send({ error: "Failed to send OTP" });
    }

    const expiresAt = Timestamp.fromMillis(now + OTP_TTL_MIN * 60 * 1000);
    await docRef.set({
      otp: generatedOtp,
      timestamp: Timestamp.fromMillis(now),
      expiresAt,
    });

    res.send({ success: true });
  } else if (action === "verify") {
    if (!otp) {
      return res
        .status(400)
        .send({ error: "OTP is required for verification" });
    }

    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return res.status(404).send({ error: "OTP not found" });
    }

    const { otp: storedOtp, expiresAt } = snapshot.data();
    const currentTs = Timestamp.now();

    if (currentTs.toMillis() > expiresAt.toMillis()) {
      return res.status(410).send({ error: "OTP expired" });
    }
    if (otp !== storedOtp) {
      return res.status(401).send({ error: "Invalid OTP" });
    }

    const plusPhone = "+" + String(phone).trim();
    console.log("Verifying phone:", plusPhone);

    try {
      // Attempt to get user
      let user;
      try {
        user = await auth.getUserByPhoneNumber(plusPhone);
        console.log("User exists:", user.uid);
      } catch (getError) {
        console.log("User not found, creating new user");
        user = await auth.createUser({
          uid: uuidv4(),
          phoneNumber: plusPhone,
        });
      }

      // Create custom token
      const token = await auth.createCustomToken(user.uid);

      // Optional: Clean up Firestore temp OTP doc
      const docRef = db.collection("otp_verification").doc(plusPhone);
      try {
        await docRef.delete();
        console.log("OTP doc cleaned up");
      } catch (delError) {
        console.warn("No OTP doc to delete or failed:", delError.message);
      }

      return res.send({ token });
    } catch (err) {
      console.error("Unexpected error:", err);
      return res.status(500).send({
        error: "Internal Server Error",
        message: err.message || "Something went wrong",
      });
    }
  } else {
    return res.status(401).send({ error: "Invalid action" });
  }
});

exports.sendCustomSms = functions.https.onRequest(async (req, res) => {
  const { phone, name, status, turl, kn, applicationId } = req.body;

  if (!kn || kn !== API_KEY) {
    return res.status(403).json({ error: "Invalid API Key" });
  }
  if (!phone || !name || !status || !turl || !applicationId) {
    return res.status(400).json({ error: "Invalid Request" });
  }

  try {
    const msg91Response = await axios.post(
      "https://control.msg91.com/api/v5/flow",
      {
        template_id: "68246464d6fc050b76430482",
        sender_id: "ALMAHD",
        short_url: "0",
        recipients: [
          {
            mobiles: phone,
            name: `#${applicationId}`,
            status: status,
            turl: `umrahvisafromindia.com`
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          authkey: MSG91_AUTHKEY,
        },
      }
    );
   
    // If MSG91 returns HTTP 202, treat as invalid mobile number
    if (msg91Response.status === 202) {
      return res.status(200).json({ success: false, error: "Invalid Mobile Number" });
    }


    if (msg91Response.data && (msg91Response.data.type === 'success')) {
      return res.status(200).json({ success: true, msg91: msg91Response.data });
    }
  } catch (err) {
    // MSG91 error responses may be in err.response.data
    if (err.response && err.response.data) {
      return res.status(500).json({ error: "Failed to send SMS", msg91: err.response.data });
    } else {
      return res.status(500).json({ error: "Failed to send SMS", message: err.message });
    }
  }
});

exports.enqueueEmail = functions.https.onRequest(async (req, res) => {
  const { from, to, subject, messageBody, label, kn } = req.body;

  if (!kn || kn !== API_KEY) {
    return res.status(403).json({ error: "Invalid API Key" });
  }

  if (!from || !to || !subject || !label) {
    return res.status(400).json({
      error: "Missing required fields: to, subject, messageBody, label",
    });
  }
  const now = Date.now();

  try {
    await db.collection("mailQueue").add({
      from,
      to,
      subject,
      messageBody,
      label,
      status: "queued",
      createdAt: Timestamp.fromMillis(now),
    });

    return res
      .status(200)
      .json({ success: true, message: "Email queued successfully" });
  } catch (err) {
    console.error("Failed to enqueue email:", err);
    return res.status(500).json({ error: "Failed to enqueue email" });
  }
});

// Firestore trigger to send the email and auto-delete the document
exports.processEmailQueue = functions.firestore.onDocumentCreated(
  "mailQueue/{mailId}",
  async (event) => {
    const snap = event.data;
    if (!snap) {
      console.log("No data found in new document");
      return;
    }

    const data = snap.data();
    const { from, to, subject, messageBody, label } = data;
    const now = Date.now();

    const params = {
      Source: `${label} <${from}@umrahvisafromindia.com>`, // use your verified domain
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
        },
        Body: {
          Html: {
            Data: messageBody, // fallback to minimal HTML
          },
        },
      },
    };

    try {
      const result = await ses.sendEmail(params).promise();
      console.log(`Email sent to ${to} from ${from}@umrahvisafromindia.com`);

      // Delete the document after successful send
      await snap.ref.delete();
    } catch (error) {
      console.error("Failed to send email:", error);

      await snap.ref.update({
        status: "failed",
        error: error.message,
        failedAt: Timestamp.fromMillis(now),
      });
    }
  }
);

function generateHtmlTemplate(status, name) {
  if (status === "paymentVerificationPending") {
    return `
      <html>
      <body style="font-family:Arial,sans-serif;background-color:#f4f6f9;padding:30px">
        <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;padding:30px;border:1px solid #e0e0e0">
          <h2 style="color:#ca8a04">Umrah Application Received</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>We have received your Umrah visa application along with your bank payment information.</p>
          <p>Our team is now reviewing the payment proof or ID you submitted. Once verified, you will receive a confirmation email.</p>
          <p style="margin-top:20px">We deeply appreciate your trust in us. May Allah make your journey smooth and accepted.</p>
          <hr style="margin:30px 0">
          <p style="font-size:12px;color:#555555">If you have any questions or wish to update your transaction proof, then you log in to our website and resubmit the payment proof under your profile section after reupload approval.</p>
          <p style="color:gray;font-size:13px;margin-top:40px">– Umrah Visa Support Team</p>
        </div>
      </body>
      </html>`;
  }

  if (status === "successful") {
    return `
      <html>
      <body style="font-family:Arial,sans-serif;background-color:#f4f6f9;padding:30px">
        <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;padding:30px;border:1px solid #e0e0e0">
          <h2 style="color:#ca8a04">Application Submitted Successfully</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>We are pleased to inform you that your Umrah visa application has been successfully submitted.</p>
          <ul>
            <li>All required passenger details received</li>
            <li>Payment completed and verified</li>
            <li>Your documents are under processing</li>
          </ul>
          <p style="margin-top:20px">You will receive a further update regarding visa issuance shortly.</p>
          <p>May Allah bless your journey and accept your prayers.</p>
          <hr style="margin:30px 0">
          <p style="font-size:12px;color:#555555">You may view your application status anytime via our website using your registered email.</p>
          <p style="color:gray;font-size:13px;margin-top:40px">– Umrah Visa Support Team</p>
        </div>
      </body>
      </html>`;
  }

  return "";
}

exports.sendAutoEmailOnStatusChange = functions.firestore.onDocumentUpdated(
  "passengers/{id}",
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (!before || !after) {
      console.log("Missing data in document update event");
      return;
    }

    const beforeStatus = before.status;
    const afterStatus = after.status;

    if (beforeStatus === afterStatus) {
      // console.log("Status unchanged. No email sent.");
      return;
    }

    // Only handle specific status changes
    if (
      afterStatus !== "paymentVerificationPending" &&
      afterStatus !== "successful"
    ) {
      // console.log("Status changed but not relevant for auto email.");
      return;
    }

    if (!after.isPrimaryPax) {
      // console.log("Not primary passenger. Skipping email.");
      return;
    }
    const applicationId = after.ordId.split("-")[1];
    const passengerId =
      after.uniqueNumber.split("-")[1] + after.uniqueNumber.split("-")[2];

    const name = after.firstName || "Applicant";
    const email = after.contactEmail;
    const phone = `91${after.contactPhone}`;

    if (!email) {
      console.warn("Missing email field in document.");
      return;
    }

    const htmlBody = generateHtmlTemplate(afterStatus, name);
    const subject =
      afterStatus === "paymentVerificationPending"
        ? `Umrah Visa Application #${applicationId} Received – Under Payment Verification`
        : `Umrah Visa Application #${applicationId} Submitted Successfully`;

    const params = {
      Source: "UmrahVisaFromIndia <no-reply@umrahvisafromindia.com>",
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: { Data: subject },
        Body: {
          Html: { Data: htmlBody },
        },
      },
    };

    try {
      const result = await ses.sendEmail(params).promise();

      console.log(`Email sent to ${email}, MessageId: ${result.MessageId}`);
    } catch (error) {
      console.error("Failed to send email:", error.message);
    }

    try {
      await axios.post(
        "https://control.msg91.com/api/v5/flow",
        {
          template_id: "68246464d6fc050b76430482",
          sender_id: "ALMAHD",
          short_url: "0",
          recipients: [
            {
              mobiles: phone,
              name: `#${applicationId}`,
              status: afterStatus === "paymentVerificationPending" ? "Payment Verification" : "Submitted",
              turl: `umrahvisafromindia.com`
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            authkey: MSG91_AUTHKEY,
          },
        }
      );
    } catch (err) {
      console.error("MSG91 error:", err.response?.data || err.message);
      return res.status(500).send({ error: "Failed to send Message" });
    }
  }
);
