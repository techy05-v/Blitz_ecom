import { PlaneTakeoff } from 'lucide-react'

export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center p-4">
      <div className="relative max-w-md mx-auto">
        {/* Floating paper planes */}
        <PlaneTakeoff className="absolute text-white/30 w-6 h-6 -top-12 right-12 transform rotate-12" />
        <PlaneTakeoff className="absolute text-white/30 w-4 h-4 top-8 -left-8 transform -rotate-45" />
        <PlaneTakeoff className="absolute text-white/30 w-5 h-5 bottom-4 right-0 transform rotate-12" />
        
        {/* Main content */}
        <div className="text-center">
          {/* Isometric box with ghost */}
          <div className="relative w-48 h-48 mx-auto mb-8">
            {/* White box */}
            <div className="absolute inset-0 bg-white transform preserve-3d rotate-x-16 rotate-y-45 shadow-xl">
              {/* Ghost illustration */}
              <div className="absolute -right-6 -top-8">
                <div className="w-20 h-24 bg-gray-700 rounded-tl-full rounded-tr-full" />
                <div className="w-8 h-8 bg-yellow-400 absolute -top-2 right-2 rounded-full" />
              </div>
            </div>
          </div>
          
          {/* Error message */}
          <h1 className="text-white text-3xl font-bold mb-4">
            Something went wrong
          </h1>
          <p className="text-white/80 text-sm max-w-sm mx-auto">
            We couldn't complete the request. Please try refreshing or contact us if the issue persists.
          </p>
        </div>
      </div>
      
      {/* Add custom styles for 3D transforms */}
      <style jsx>{`
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .rotate-x-16 {
          transform: rotateX(16deg);
        }
        .rotate-y-45 {
          transform: rotateY(45deg);
        }
      `}</style>
    </div>
  )
}

