import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: "Is this gambling?",
      answer: "GAUNT.GG is a skill-based competition platform. To play, you must sign up and verify your account. Matches are created and played outside the website in custom game lobbies. GAUNT.GG manages booking, check-in, and payouts."
    },
    {
      question: "How do payouts work?",
      answer: "The winner receives the total pot minus a 10% platform fee. Bonds manage no-shows: each player puts up a bond (½ of platform fee ÷ players). If someone no-shows, their bond is forfeited — $1 max goes to platform admin fee, the rest credits the attending player. Both buy-ins are refunded on no-shows."
    },
    {
      question: "What about streaming?",
      answer: "Streaming (with delay) is planned for future phases to prevent ghosting and cheating. Phase 1 focuses on core lobby discovery and match mechanics."
    },
    {
      question: "Which regions are supported?",
      answer: "We're piloting in OCE (Oceania) first. More regions including NA, EU, and SEA are coming soon based on community demand."
    },
    {
      question: "How does check-in work?",
      answer: "For \"Play Now\" lobbies, a 10-minute check-in window opens immediately when both players join. For scheduled matches, check-in opens 10 minutes before the slot and closes 10 minutes after. Both players must check in to receive the match code. The actual match is played in a custom lobby within your game client."
    },
    {
      question: "Is my data safe?",
      answer: "Yes. We use Row-Level Security (RLS) policies to ensure users can only access their own data. All sensitive operations require authentication, and we follow industry-standard security practices."
    }
  ]

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="bg-background py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-white text-center mb-16 font-mono">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-gray-900 rounded-lg border border-gray-800">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-800 transition-colors"
              >
                <span className="text-white font-medium">{faq.question}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-white transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-300">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FAQ
