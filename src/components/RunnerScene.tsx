import React, { useEffect, useRef, useState } from 'react';
import { UserRound } from 'lucide-react';

export const RunnerScene: React.FC = () => {
  const runnerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const textXRef = useRef<number>(0);
  const [imageError, setImageError] = useState(false);

  const animate = () => {
    if (runnerRef.current && textRef.current) {
      const runnerRect = runnerRef.current.getBoundingClientRect();
      const runnerX = runnerRect.left;

      // text follow chậm hơn (tạo cảm giác kéo)
      textXRef.current += (runnerX - textXRef.current) * 0.08;

      textRef.current.style.transform = `translate(${textXRef.current}px, -50%)`;
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  return (
    <div className="runner-scene">
      <div 
        className="runner flex items-center justify-center" 
        ref={runnerRef}
      >
        {!imageError ? (
          <img 
            src="/runner.png" 
            className="h-full w-auto" 
            alt="runner"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="bg-accent-primary/20 p-4 rounded-full border border-accent-primary/30 backdrop-blur-sm">
            <UserRound className="w-10 h-10 text-accent-primary animate-bounce" />
          </div>
        )}
      </div>
      <div className="drag-text" ref={textRef}>
        Trung tâm Văn hóa và Thư viện Hà Nội
      </div>
    </div>
  );
};
