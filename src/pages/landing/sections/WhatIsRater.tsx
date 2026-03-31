
import gradientArrow from '../../../assets/landing/what-is-rater/Gradient Arrow.svg';
import whatIsRaterVisual from '../../../assets/landing/what-is-rater/what is rater-visual.png';
import { useTiltEffect } from '../../../hooks/useTiltEffect';
import { ShimmerOverlay } from '../../../components/ShimmerOverlay';

export function WhatIsRater() {
  const tiltRef = useTiltEffect<HTMLDivElement>();

  return (
    <section id="what-is-rater" className="py-16 md:py-24 relative z-10">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center gap-14 md:gap-20">
        
        {/* Left Side — Text Content */}
        <div className="w-full md:w-[45%] flex flex-col items-center md:items-start text-center md:text-left md:ml-4 lg:ml-8">
          
          {/* Header & CTA Wrapper */}
          <div className="flex flex-row md:flex-col items-center md:items-start justify-center md:justify-start flex-wrap gap-3 md:gap-0 mb-8 md:mb-14 lg:mb-16">
            <h2 className="text-[28px] md:text-[36px] lg:text-[42px] font-semibold text-[#111111] tracking-tight leading-tight">
              What is Rater, really?
            </h2>
            
            {/* CTA Element (Inline) */}
            <div className="md:mt-2">
              <div className="inline-flex items-center justify-start pl-[16px] border-2 border-[#FEC312] rounded-[30px] w-[100px] h-[36px]">
                <img src={gradientArrow} alt="" className="w-[17px] h-[17px] object-contain" />
              </div>
            </div>
          </div>

          <p className="text-[#333333] text-[15px] md:text-[16px] lg:text-[17px] leading-[1.6] max-w-[420px]">
            Instead of likes and comments, Rater centers on <span className="font-bold text-[#111111]">structured ratings and context.</span>
            <br />
            Helping designers understand <span className="font-bold text-[#111111]">why something works</span>, not just whether it's popular.
          </p>
        </div>

        {/* Right Side — Supporting Visual */}
        <div className="w-full md:w-[55%] relative flex justify-center md:justify-end mt-4 md:mt-0">
          <div ref={tiltRef} className="relative inline-block w-full max-w-[460px] md:max-w-[550px] lg:max-w-[600px]">
            <img 
              src={whatIsRaterVisual} 
              alt="Rater structured rating system interface" 
              className="w-full h-auto object-contain relative z-10 drop-shadow-sm select-none"
              draggable={false}
            />

            {/* Shimmer Effect */}
            <ShimmerOverlay />
            
            {/* Overlay Label */}
            <div className="absolute -bottom-1 right-18 xs:right-28 md:right-24 lg:right-36 z-20 pointer-events-none">
              <span className="text-[12px] md:text-[13.5px] text-[#555555] font-semibold tracking-wide italic">
                Evaluation beats reaction
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
