import { Gamepad2, Clock, DollarSign } from 'lucide-react'

const HowItWorks = () => {
  const steps = [
    {
      icon: Gamepad2,
      title: "Create or Join",
      description: "Pick your game, region, and buy-in amount to create or join a lobby"
    },
    {
      icon: Clock,
      title: "Check-in & Play",
      description: "Check in within your window, then compete in-game using custom lobby codes"
    },
    {
      icon: DollarSign,
      title: "Submit & Get Paid",
      description: "Report your result, winner receives pot minus 10% platform fee"
    }
  ]

  return (
    <section className="relative bg-gradient-to-b from-background to-gray-900 py-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-5xl font-bold text-white text-center mb-20">
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            How It Works
          </span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div key={index} className="group text-center">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="w-10 h-10 text-white" />
                </div>
                {/* Connection line for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-500/50 to-purple-500/50 transform translate-x-10"></div>
                )}
              </div>
              <h3 className="text-2xl font-bold text-white mb-6 group-hover:text-blue-400 transition-colors">
                {step.title}
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed group-hover:text-gray-200 transition-colors">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
