import { Shield, Lock, CheckCircle, Database, Zap } from 'lucide-react'

const TrustAndFairness = () => {
  const features = [
    {
      icon: Shield,
      title: "KYC Ready",
      status: null
    },
    {
      icon: Lock,
      title: "Escrow",
      status: "Planned"
    },
    {
      icon: CheckCircle,
      title: "Result Verification",
      status: "Planned"
    },
    {
      icon: Database,
      title: "RLS Protection",
      status: null
    }
  ]

  return (
    <section className="relative bg-gradient-to-b from-gray-900 to-background py-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-5xl font-bold text-white text-center mb-20">
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Built on Trust & Fairness
          </span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="group bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border border-gray-700 hover:border-gray-600 text-center transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">
                {feature.title}
              </h3>
              {feature.status && (
                <span className="inline-block bg-gradient-to-r from-gray-700 to-gray-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                  {feature.status}
                </span>
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <div className="inline-flex items-center gap-3 bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl px-6 py-4 text-gray-300">
            <div className="p-2 bg-yellow-500/20 rounded-full">
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-sm">
              Live streaming will include a platform delay to reduce ghosting/cheating (future phase).
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default TrustAndFairness
