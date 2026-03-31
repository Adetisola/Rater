import gradientArrow from '../../../assets/landing/why-rater/Gradient Arrow.svg';
import whyRaterVisual from '../../../assets/landing/why-rater/why rater-visual.png';
import starIcon from '../../../assets/icons/star-active-yellow.svg';
import { useTiltEffect } from '../../../hooks/useTiltEffect';
import { ShimmerOverlay } from '../../../components/ShimmerOverlay';

export function WhyRater() {
  const tiltRef = useTiltEffect<HTMLDivElement>();

  return (
    <section id="why-rater" className="py-16 md:py-24 relative z-10">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-14 md:gap-20">
        
        {/* Left Side — Supporting Visual */}
        <div className="w-full md:w-[50%] relative flex justify-center md:justify-start mt-4 md:mt-0">
          <div ref={tiltRef} className="relative inline-block w-full max-w-[400px] md:max-w-[500px]">
            <img 
              src={whyRaterVisual} 
              alt="Design feedback rating interface" 
              className="w-full h-auto object-contain relative z-10 drop-shadow-sm pointer-events-none"
            />

            {/* Shimmer Effect */}
            <ShimmerOverlay />
          </div>
        </div>

        {/* Right Side — Text Content */}
        <div className="w-full md:w-[50%] flex flex-col items-center md:items-start text-center md:text-left mt-10 md:mt-0">
          
          {/* Header & CTA Wrapper */}
          <div className="flex flex-row md:flex-col items-center md:items-start justify-center md:justify-start flex-wrap gap-3 md:gap-0 mb-8 md:mb-12">
            <h2 className="text-[28px] md:text-[36px] lg:text-[42px] font-semibold text-[#111111] tracking-tight leading-tight">
              Feedback Shouldn’t Be A<br className="hidden md:block" /> Guessing Game.
            </h2>
            
            {/* CTA Element (Inline) */}
            <div className="md:mt-4">
              <div className="inline-flex items-center justify-start pl-[16px] border-2 border-[#FEC312] rounded-[30px] w-[100px] h-[36px]">
                <img src={gradientArrow} alt="" className="w-[17px] h-[17px] object-contain" />
              </div>
            </div>
          </div>

          {/* Key Points */}
          <ul className="flex flex-col gap-5 w-full max-w-[420px] md:max-w-[500px] lg:max-w-[550px] mx-auto md:mx-0">
            <li className="flex flex-row items-start md:items-center gap-4">
              <img src={starIcon} alt="Star" className="w-[20px] h-[20px] shrink-0 object-contain mt-0.5 md:mt-0" />
              <p className="text-[#333333] text-[15px] md:text-[16px] lg:text-[17px] font-semibold text-left leading-snug">
                Rater makes feedback intentional.
              </p>
            </li>
            <li className="flex flex-row items-start md:items-center gap-4">
              <img src={starIcon} alt="Star" className="w-[20px] h-[20px] shrink-0 object-contain mt-0.5 md:mt-0" />
              <p className="text-[#333333] text-[15px] md:text-[16px] lg:text-[17px] font-semibold text-left leading-snug">
                Vague praise alone doesn’t help you grow.
              </p>
            </li>
            <li className="flex flex-row items-start md:items-center gap-4">
              <img src={starIcon} alt="Star" className="w-[20px] h-[20px] shrink-0 object-contain mt-0.5 md:mt-0" />
              <p className="text-[#333333] text-[15px] md:text-[16px] lg:text-[17px] font-semibold text-left leading-snug">
                Ratings without context don’t teach you anything.
              </p>
            </li>
          </ul>

        </div>
      </div>
    </section>
  );
}
