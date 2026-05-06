// TermsAndConditions.jsx
import React from "react";

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-pink-50 text-gray-800 px-6 py-10">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-8">
        <h1 className="text-4xl font-bold text-pink-600 mb-6">
          Terms & Conditions
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
              Welcome to our Salon Booking System. By accessing or using our
              website and services, you agree to comply with and be bound by
              these Terms and Conditions. Please read them carefully before
              making a booking.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-pink-500 mb-2">
              2. Booking Appointments
            </h2>
            <p>
              Appointments can be booked online through our salon booking
              system. Clients are responsible for providing accurate contact and
              appointment details. We reserve the right to cancel or refuse any
              booking at our discretion.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-pink-500 mb-2">
              3. Cancellations & Rescheduling
            </h2>
            <p>
              Clients may cancel or reschedule appointments up to 24 hours
              before the scheduled appointment time. Late cancellations or
              missed appointments may be subject to a cancellation fee.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-pink-500 mb-2">
              4. Payments
            </h2>
            <p>
              Payment for services can be made online or at the salon. Prices
              for services are subject to change without prior notice. We accept
              major payment methods as displayed during checkout.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-pink-500 mb-2">
              5. Refund Policy
            </h2>
            <p>
              Refunds are not provided for completed services. If you are
              dissatisfied with a service, please contact us within 48 hours and
              we will review your concern.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-pink-500 mb-2">
              6. Client Responsibilities
            </h2>
            <p>
              Clients are expected to arrive on time for appointments. Late
              arrivals may result in reduced service time or appointment
              cancellation. Clients must inform us of any allergies, medical
              conditions, or sensitivities prior to treatment.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-pink-500 mb-2">
              7. Privacy
            </h2>
            <p>
              We value your privacy and handle your personal information in
              accordance with our Privacy Policy. By using our booking system,
              you consent to the collection and use of your information for
              appointment management and communication purposes.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-pink-500 mb-2">
              8. Service Availability
            </h2>
            <p>
              We strive to ensure all services are available as listed.
              However, we reserve the right to modify, suspend, or discontinue
              services at any time without notice.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-pink-500 mb-2">
              9. Limitation of Liability
            </h2>
            <p>
              We are not liable for any indirect, incidental, or consequential
              damages arising from the use of our booking system or salon
              services, except where required by law.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-pink-500 mb-2">
              10. Changes to Terms
            </h2>
            <p>
              We may update these Terms and Conditions from time to time.
              Continued use of the booking system after changes are posted
              constitutes acceptance of the revised terms.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-pink-500 mb-2">
              11. Contact Us
            </h2>
            <p>
              If you have any questions about these Terms and Conditions, please
              contact us at{" "}
              <a
                href="mailto:support@salonbooking.com"
                className="text-pink-600 underline"
              >
                support@salonbooking.com
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}