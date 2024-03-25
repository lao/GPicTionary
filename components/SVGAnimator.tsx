import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

import AnimationTimeline from './AnimationTimeline';

interface SVGAnimatorProps {
  svgContent: string;
  duration: number;
}

const SVGAnimator: React.FC<SVGAnimatorProps> = ({ svgContent, duration }) => {
  const [shouldDisplay, setShouldDisplay] = useState(false);
  const svgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (svgContent && svgRef.current) {
      const svgElements = svgRef.current.querySelectorAll('path, line, rect, circle, polygon');
      svgElements.forEach((elem: Element) => {
        if (!(elem instanceof SVGPathElement || elem instanceof SVGLineElement || elem instanceof SVGRectElement || elem instanceof SVGCircleElement || elem instanceof SVGGElement)) {
          return;
        }

        // Set initial styles for animatable properties
        elem.style.opacity = '0';

        if (elem instanceof SVGPathElement) {
          const length = elem.getTotalLength();
          elem.style.strokeDasharray = `${length}`;
          elem.style.strokeDashoffset = `${length}`;
        }
      });
      setShouldDisplay(true);
      const tl = gsap.timeline();
      console.log(svgElements.length)
      svgElements.forEach((elem, index) => {
        // Animate different properties based on the element type
        const animationProps = elem.tagName === 'path' ? {
          strokeDashoffset: 0,
          opacity: 1,
        } : {
          opacity: 1,
        };

        console.log(duration / svgElements.length)
        console.log(index * (duration / svgElements.length))

        tl.to(elem, {
          ...animationProps,
          duration: duration / svgElements.length,
          delay: index * (duration / svgElements.length),
        });
      });

      // Cleanup function to prevent memory leaks
      return () => {
        tl.kill();
      };
    }
  }, [svgContent, duration]);

  return (
    <div style={{ opacity: shouldDisplay ? 1 : 0, transition: 'opacity 0.5s' }} >
      {
        <div ref={svgRef} dangerouslySetInnerHTML={{ __html: svgContent }} />
      }
    </div>
  );
};

export default SVGAnimator;
