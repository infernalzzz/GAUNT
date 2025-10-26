const TransparentFees = () => {
  return (
    <section className="bg-background py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-white text-center mb-16">
          Transparent Fees
        </h2>
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-300">Pot =</span>
                  <span className="text-white">Buy-in x Players</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Platform fee =</span>
                  <span className="text-white">10% of Pot</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Bond pool =</span>
                  <span className="text-white">% of Platform fee</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Bond/player =</span>
                  <span className="text-white">Bond pool ÷ Players</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Admin fee (no-show) =</span>
                  <span className="text-white">$1.00 max</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Winner Payout =</span>
                  <span className="text-green-500 font-semibold">Pot - Platform fee</span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-700">
              <p className="text-gray-400 text-sm mb-2">
                Use the tooltip on any lobby card or Create Lobby modal for live fee calculations with your specific buy-in.
              </p>
              <p className="text-gray-400 text-sm">
                All amounts in AUD with 2-decimal rounding. Live calculations shown in Create/Join modals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default TransparentFees
