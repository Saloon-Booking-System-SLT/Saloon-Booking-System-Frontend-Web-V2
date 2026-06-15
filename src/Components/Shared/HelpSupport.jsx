// HelpSupport.jsx
import React, { useState } from "react";

const faqs = [
  {
    question: "How do I book a salon appointment?",
    answer:
      "You can book an appointment by searching for a salon, selecting your preferred service, choosing an available time slot, and confirming your booking through the system.",
  },
  {
    question: "Can I cancel or reschedule my appointment?",
    answer:
      "Yes. You can cancel or reschedule your appointment from your bookings page up to 24 hours before your scheduled appointment time.",
  },
  {
    question: "How do I pay for my appointment?",
    answer:
      "Payments can be made online during booking or at the salon, depending on the salon’s available payment options.",
  },
  {
    question: "What happens if I miss my appointment?",
    answer:
      "Missed appointments may be subject to cancellation fees depending on the salon’s policy.",
  },
  {
    question: "How do I contact customer support?",
    answer:
      "You can reach our support team by email at support@salonbooking.com or through the contact form available on this page.",
  },
  {
    question: "How do I update my profile information?",
    answer:
      "You can update your name, phone number, and other account details from your profile settings after logging in.",
  },
];

export default function HelpSupport() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-pink-50 text-gray-800 px-6 py-10">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-8">
        <h1 className="text-4xl font-bold text-pink-600 mb-4">
          Help & Support
        </h1>
        <p className="text-gray-500 mb-8">
          Need help? Find answers to common questions below.
        </p>

        {/* FAQ Section */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex justify-between items-center px-5 py-4 text-left font-medium text-gray-800 hover:bg-pink-50 transition"
              >
                <span>{faq.question}</span>
                <span className="text-pink-600 text-xl">
                  {openIndex === index ? "−" : "+"}
                </span>
              </button>

              {openIndex === index && (
                <div className="px-5 pb-4 text-gray-600">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="mt-10 border-t pt-8">
          <h2 className="text-2xl font-semibold text-pink-500 mb-3">
            Still need help?
          </h2>
          <p className="text-gray-600 mb-4">
            If you couldn’t find the answer you were looking for, our support
            team is here to help.
          </p>
          <a
            href="mailto:support@salonbooking.com"
            className="inline-block bg-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-pink-700 transition"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}