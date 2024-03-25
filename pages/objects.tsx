import React, { useState, useEffect } from 'react';
import SVGAnimator from '../components/SVGAnimator';
import AnimationTimeline from '../components/AnimationTimeline';

interface SVG {
  content: string;
  width: number;
  height: number;
}

interface ObjectData {
  answer: string;
  svg: SVG;
}

const DEFAULT_DURATION = 25;

const ObjectRenderer: React.FC = () => {
  const [objects, setObjects] = useState<ObjectData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPaths, setShowPaths] = useState<boolean[]>([]);
  const [shouldReset, setShouldReset] = useState(false);
  const [duration, setDuration] = useState(DEFAULT_DURATION);

  useEffect(() => {
    const fetchObjects = async () => {
      try {
        const response = await fetch('/api/objects');
        const data: ObjectData[] = await response.json();
        setObjects(data);
        setShowPaths(data.map(() => false)); // Initialize showPaths array to all false
      } catch (error) {
        console.error('Error fetching objects:', error);
      }
    };

    fetchObjects();
  }, []);

  useEffect(() => {
    if (objects.length > 0) {
      const timer = setTimeout(() => {
        const newShowPaths = [...showPaths];
        const randomIndex = Math.floor(Math.random() * newShowPaths.length);
        newShowPaths[randomIndex] = true;
        setShowPaths(newShowPaths);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [objects, showPaths]);

  const showPrevObject = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + objects.length) % objects.length);
    setShowPaths(objects.map(() => false)); // Reset showPaths when switching objects
    setDuration(DEFAULT_DURATION);
    setShouldReset(true);
    setTimeout(() => setShouldReset(false), 0);
  };

  const showNextObject = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % objects.length);
    setShowPaths(objects.map(() => false)); // Reset showPaths when switching objects
    setDuration(DEFAULT_DURATION);
    setShouldReset(true);
    setTimeout(() => setShouldReset(false), 0);
  };

  if (objects.length === 0) {
    return <div>Loading...</div>;
  }

  const currentObject = objects[currentIndex];

  return (
    <div className="container">
      <div className="object-container">
        <h2>{currentObject.answer}</h2>
        <div>
          <SVGAnimator svgContent={currentObject.svg.content} duration={duration}/>
          <AnimationTimeline duration={duration} reset={shouldReset}/>
        </div>
      </div>
      <div className="navigation">
        <button onClick={showPrevObject}>Previous</button>
        <button onClick={showNextObject}>Next</button>
      </div>
      <style jsx>{`
        .container {
          text-align: center;
        }

        .object-container {
          margin-bottom: 20px;
          color: white;
          background-color: #333;
          height: 500px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .navigation {
          margin-top: 20px;
        }
        button {
          background-color: #4CAF50;
          border: none;
          color: white;
          padding: 15px 32px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 16px;
          margin: 4px 2px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default ObjectRenderer;


