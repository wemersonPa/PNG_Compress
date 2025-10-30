import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-dark-card shadow-md">
      <div className="container mx-auto px-4 py-4">
        <h1 className="text-2xl md:text-3xl font-bold text-center text-light-text tracking-wider">
          <span className="text-brand-primary">WebP</span>Slim
        </h1>
        <p className="text-center text-medium-text mt-1">
          Fast, private, and powerful PNG to WebP conversion in your browser.
        </p>
      </div>
    </header>
  );
};

export default Header;