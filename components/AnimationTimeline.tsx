import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

interface AnimationTimelineProps {
  duration: number;
  reset: boolean;
}

const AnimationTimeline: React.FC<AnimationTimelineProps> = ({ duration, reset }) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const secondsLeftRef = useRef(duration);
  const timelineTimelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (reset) {
      progressRef.current = 0;
      secondsLeftRef.current = duration;

      if (timelineTimelineRef.current) {
        timelineTimelineRef.current?.kill();
        timelineTimelineRef?.current?.seek(0); // Seek the timeline to the beginning
      }
    }
  }, [reset]);

  useEffect(() => {
    if (timelineRef.current) {
      timelineTimelineRef.current = gsap.timeline({
        onUpdate: () => {
          progressRef.current = timelineTimelineRef.current!.progress();
          if (timelineRef.current?.children[0]) {
            (timelineRef.current.children[0] as HTMLElement).style.width = `${progressRef.current * 100}%`;
          }
          secondsLeftRef.current = duration * (1 - progressRef.current);
          if (timelineRef.current?.children[1]) {
            timelineRef.current.children[1].textContent = `${secondsLeftRef.current.toFixed()}s`;
          }
        },
        onComplete: () => {
          if (timelineRef.current?.children[1]) {
            timelineRef.current.children[1].textContent = '0.0s';
          }
        },
      });

      timelineTimelineRef.current.to(timelineRef.current.children[0], {
        width: '100%',
        duration: duration,
      });

      return () => {
        timelineTimelineRef.current?.kill();
      };
    }
  }, [duration]);

  return (
    <div
      ref={timelineRef}
      style={{
        width: '100%',
        height: '24px',
        backgroundColor: 'gray',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px',
      }}
    >
      <div
        style={{
          height: '4px',
          backgroundColor: 'green',
          width: '0%',
        }}
      />
      <span style={{ fontSize: '12px', color: 'white' }}>
        {secondsLeftRef.current.toFixed(1)}s
      </span>
    </div>
  );
};

export default AnimationTimeline;
