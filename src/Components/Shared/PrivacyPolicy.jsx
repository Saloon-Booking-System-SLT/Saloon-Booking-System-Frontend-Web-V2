// PrivacyPolicy.jsx
import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-pink-50 text-gray-800 px-6 py-10">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-8">
        <h1 className="text-4xl font-bold text-pink-600 mb-6">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Last Updated: May 6, 2026
        </p>

        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-pink-500 mb-2">
              1. Introduction
            </h2>
            <p>
              Your privacy matters to us. This Privacy Policy explains how the
              SLT-Mobitel Salon Booking System collects, uses, stores, and
              protects your personal information when you use our website and
              booking services.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-pink-500 mb-2">
              2. Information We Collect
            </h2>
            <p>
              We may collect personal details such as your name, email address,
              phone number, appointment preferences, and payment details when
              you make a booking or use our services.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-pink-500 mb-2">
              3. How We Use Your Information
            </h2>
            <p>
              Your information is used to manage bookings, process payments,
              provide customer support, improve our services, and send important
              updates related to your appointments.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-pink-500 mb-2">
              4. Sharing Your Information
            </h2>
            <p>
              We do not sell your personal information. Your data may be shared
              only with salon partners, payment processors, or service providers
              necessary to deliver booking and payment functionality.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-pink-500 mb-2">
              5. Data Security
            </h2>
            <p>
              We implement reasonable technical and organizational measures to
              protect your personal data from unauthorized access, loss, misuse,
              or disclosure.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-pink-500 mb-2">
              6. Cookies & Tracking
            </h2>
            <p>
              Our website may use cookies and similar technologies to enhance
              user experience, analyze traffic, and improve platform
              performance. You may control cookies through your browser
              settings.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-pink-500 mb-2">
              7. Your Rights
            </h2>
            <p>
              You may request access to, correction of, or deletion of your
              personal data, subject to applicable legal requirements and
              business obligations.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-pink-500 mb-2">
              8. Third-Party Services
            </h2>
            <p>
              Our platform may integrate third-party tools such as payment
              gateways and analytics providers. Their handling of your data is
              governed by their respective privacy policies.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-pink-500 mb-2">
              9. Policy Updates
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will
              be posted on this page, and continued use of our services after
              updates means you accept the revised policy.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-pink-500 mb-2">
              10. Contact Us
            </h2>
            <p>
              If you have questions about this Privacy Policy or how your data
              is handled, contact us at{" "}
              <a
                href="mailto:privacy@salonbooking.com"
                className="text-pink-600 underline"
              >
                privacy@salonbooking.com
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}