
import React from 'react';
import useRealTime from '../hooks/useRealTime';

const RealTimeClock = () => {
  const time = useRealTime('America/Port-au-Prince');

  return (
    <div className="flex items-center space-x-2 text-sm">
      <span className="font-semibold">Port-au-Prince:</span>
      <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{time}</span>
    </div>
  );
};

export default RealTimeClock;

