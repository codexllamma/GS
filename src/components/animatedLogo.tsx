import React, { useEffect, useRef, useState } from "react";

export default function AnimatedLogo({
  width = 160,
  height = 50,
}: {
  width?: number;
  height?: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!svgRef.current || !isHovered) return;

    const animations = svgRef.current.querySelectorAll('animate, animateTransform');
    
    animations.forEach(anim => {
      const element = anim as SVGAnimateElement;
      element.beginElement();
    });
  }, [isHovered]);

  return (
    <div
      style={{
        width,
        height,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 0,
        cursor: "pointer",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 1911 1000"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style>{`
            path { vector-effect: non-scaling-stroke; }
            .letra-fill { transition: fill 0.3s ease; }
            .letra-base { fill: #6b7280; }
          `}</style>

          {/* Path definitions */}
          <path id="p-Hbar" d="M112 0H98Q90 0 90 9V464Q90 472 90 472H90Q90 472 90 480V492Q90 500 90 500H90Q90 500 90 508V634Q90 643 98 643H112Q120 643 120 634V508Q120 500 129 500H439Q448 500 448 508V634Q448 643 456 643H470Q478 643 478 634V508Q478 500 478 500H478Q478 500 478 492V480Q478 472 478 472H478Q478 472 478 464V9Q478 0 470 0H456Q448 0 448 9V306Q448 314 439 314H129Q120 314 120 306V9Q120 0 112 0ZM129 342H439Q448 342 448 350V464Q448 472 439 472H129Q120 472 120 464V350Q120 342 129 342Z" />

          <path id="p-I" d="M125 634V9Q125 0 117 0H103Q95 0 95 9V634Q95 643 103 643H117Q125 643 125 634Z" />

          <path id="p-Egrave" d="M268 707H260Q252 707 246 715L154 827Q151 831 152.5 833.5Q154 836 158 836H188Q198 836 203 827L271 716Q276 707 268 707ZM402 0H98Q90 0 90 9V634Q90 643 98 643H402Q411 643 411 635V623Q411 615 402 615H129Q120 615 120 607V350Q120 342 129 342H376Q385 342 385 334V322Q385 314 376 314H129Q120 314 120 306V36Q120 28 129 28H402Q411 28 411 20V8Q411 0 402 0Z" />

          <path id="p-R" d="M112 0H98Q90 0 90 9V634Q90 643 98 643H323Q384 643 420.5 606.0Q457 569 457 507V407Q457 351 427.0 315.5Q397 280 346 273V269L469 9Q474 0 465 0H447Q439 0 434 9L312 271H129Q120 271 120 263V9Q120 0 112 0ZM129 299H323Q373 299 400.0 328.0Q427 357 427 408V506Q427 557 400.0 586.0Q373 615 323 615H129Q120 615 120 607V307Q120 299 129 299Z" />

          {/* Masks */}
          <mask id="mask-H">
            <use href="#p-Hbar" fill="white"/>
          </mask>
          <mask id="mask-I">
            <use href="#p-I" fill="white"/>
          </mask>
          <mask id="mask-E">
            <path d="M402 0H98Q90 0 90 9V634Q90 643 98 643H402Q411 643 411 635V623Q411 615 402 615H129Q120 615 120 607V350Q120 342 129 342H376Q385 342 385 334V322Q385 314 376 314H129Q120 314 120 306V36Q120 28 129 28H402Q411 28 411 20V8Q411 0 402 0Z" fill="white"/>
          </mask>
          <mask id="mask-accent">
            <path d="M268 707H260Q252 707 246 715L154 827Q151 831 152.5 833.5Q154 836 158 836H188Q198 836 203 827L271 716Q276 707 268 707Z" fill="white"/>
          </mask>
          <mask id="mask-R">
            <use href="#p-R" fill="white"/>
          </mask>
        </defs>

        <g transform="translate(0,1000) scale(1,-1)">
          
          {/* H Letter - Base layer (always visible) */}
          <g transform="translate(0,70)">
            <use href="#p-Hbar" className="letra-base" />
          </g>

          {/* I Letter - Base layer */}
          <g transform="translate(520,70)">
            <use href="#p-I" className="letra-base" />
          </g>

          {/* E Letter - Base layer */}
          <g transform="translate(680,70)">
            <path d="M402 0H98Q90 0 90 9V634Q90 643 98 643H402Q411 643 411 635V623Q411 615 402 615H129Q120 615 120 607V350Q120 342 129 342H376Q385 342 385 334V322Q385 314 376 314H129Q120 314 120 306V36Q120 28 129 28H402Q411 28 411 20V8Q411 0 402 0Z" className="letra-base" />
            <path d="M268 707H260Q252 707 246 715L154 827Q151 831 152.5 833.5Q154 836 158 836H188Q198 836 203 827L271 716Q276 707 268 707Z" className="letra-base" />
          </g>

          {/* R Letter - Base layer */}
          <g transform="translate(1100,60)">
            <use href="#p-R" className="letra-base" />
          </g>

          {/* Animated black fill layer on hover */}
          {isHovered && (
            <>
              {/* H Letter - Black fill */}
              <g transform="translate(0,70)">
                <g mask="url(#mask-H)">
                  {/* Left vertical (top to bottom) */}
                  <rect x="90" y="0" width="30" height="0" fill="#000000">
                    <animate
                      attributeName="height"
                      from="0"
                      to="643"
                      dur="0.8s"
                      begin="indefinite"
                      fill="freeze"
                      calcMode="spline"
                      keySplines="0.25 0.1 0.25 1"
                    />
                  </rect>
                  
                  {/* Right vertical (bottom to top) */}
                  <rect x="448" y="643" width="30" height="0" fill="#000000">
                    <animate
                      attributeName="y"
                      from="643"
                      to="0"
                      dur="0.8s"
                      begin="indefinite"
                      fill="freeze"
                      calcMode="spline"
                      keySplines="0.25 0.1 0.25 1"
                    />
                    <animate
                      attributeName="height"
                      from="0"
                      to="643"
                      dur="0.8s"
                      begin="indefinite"
                      fill="freeze"
                      calcMode="spline"
                      keySplines="0.25 0.1 0.25 1"
                    />
                  </rect>
                  
                  {/* Middle crossbar connecting the two verticals */}
                  <rect x="120" y="342" width="0" height="130" fill="#000000">
                    <animate
                      attributeName="width"
                      from="0"
                      to="328"
                      dur="0.6s"
                      begin="0.1s"
                      fill="freeze"
                      calcMode="spline"
                      keySplines="0.25 0.1 0.25 1"
                    />
                  </rect>
                  
                  {/* Bottom text section - full width thick bar */}
                  <rect x="26" y="472" width="0" height="70" fill="#000000">
                    <animate
                      attributeName="width"
                      from="0"
                      to="516"
                      dur="0.6s"
                      begin="0.1s"
                      fill="freeze"
                      calcMode="spline"
                      keySplines="0.25 0.1 0.25 1"
                    />
                  </rect>
                </g>
              </g>

              {/* I Letter - Black fill */}
              <g transform="translate(520,70)">
                <g mask="url(#mask-I)">
                  <rect x="95" y="643" width="30" height="0" fill="#000000">
                    <animate
                      attributeName="y"
                      from="643"
                      to="0"
                      dur="0.8s"
                      begin="indefinite"
                      fill="freeze"
                      calcMode="spline"
                      keySplines="0.25 0.1 0.25 1"
                    />
                    <animate
                      attributeName="height"
                      from="0"
                      to="643"
                      dur="0.8s"
                      begin="indefinite"
                      fill="freeze"
                      calcMode="spline"
                      keySplines="0.25 0.1 0.25 1"
                    />
                  </rect>
                </g>
              </g>

              {/* E Letter - Black fill */}
              <g transform="translate(680,70)">
                <g mask="url(#mask-E)">
                  {/* Vertical stroke */}
                  <rect x="90" y="643" width="30" height="0" fill="#000000">
                    <animate
                      attributeName="y"
                      from="643"
                      to="0"
                      dur="0.9s"
                      begin="indefinite"
                      fill="freeze"
                      calcMode="spline"
                      keySplines="0.25 0.1 0.25 1"
                    />
                    <animate
                      attributeName="height"
                      from="0"
                      to="643"
                      dur="0.9s"
                      begin="indefinite"
                      fill="freeze"
                      calcMode="spline"
                      keySplines="0.25 0.1 0.25 1"
                    />
                  </rect>
                  
                  {/* Bottom bar */}
                  <rect x="120" y="0" width="0" height="36" fill="#000000">
                    <animate
                      attributeName="width"
                      from="0"
                      to="291"
                      dur="0.25s"
                      begin="indefinite"
                      fill="freeze"
                      calcMode="spline"
                      keySplines="0.25 0.1 0.25 1"
                    />
                  </rect>
                  
                  {/* Middle bar */}
                  <rect x="120" y="314" width="0" height="36" fill="#000000">
                    <animate
                      attributeName="width"
                      from="0"
                      to="265"
                      dur="0.25s"
                      begin="indefinite"
                      fill="freeze"
                      calcMode="spline"
                      keySplines="0.25 0.1 0.25 1"
                    />
                  </rect>
                  
                  {/* Top bar */}
                  <rect x="120" y="607" width="0" height="36" fill="#000000">
                    <animate
                      attributeName="width"
                      from="0"
                      to="291"
                      dur="0.25s"
                      begin="indefinite"
                      fill="freeze"
                      calcMode="spline"
                      keySplines="0.25 0.1 0.25 1"
                    />
                  </rect>
                </g>
                
                {/* Accent mark */}
                <g mask="url(#mask-accent)">
                  <circle cx="212" cy="770" r="0" fill="#000000">
                    <animate
                      attributeName="r"
                      from="0"
                      to="150"
                      dur="0.2s"
                      begin="indefinite"
                      fill="freeze"
                      calcMode="spline"
                      keySplines="0.5 0 0.5 1"
                    />
                  </circle>
                </g>
              </g>

              {/* R Letter - Black fill */}
              <g transform="translate(1100,60)">
                <g mask="url(#mask-R)">
                  <circle cx="280" cy="450" r="0" fill="#000000">
                    <animate
                      attributeName="r"
                      from="0"
                      to="1200"
                      dur="0.9s"
                      begin="indefinite"
                      fill="freeze"
                      calcMode="spline"
                      keySplines="0.25 0 0.5 1"
                    />
                  </circle>
                </g>
              </g>
            </>
          )}
        </g>
      </svg>
    </div>
  );
}