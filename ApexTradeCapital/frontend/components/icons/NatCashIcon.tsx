import React from 'react';

const NatCashIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" {...props}>
        <circle cx="32" cy="32" r="30" fill="#D62828" />
        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="24" fontFamily="Arial, sans-serif" fontWeight="bold">
            N
        </text>
    </svg>
);

export default NatCashIcon;
