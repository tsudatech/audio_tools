// App.js
import React from "react";

function TopPage() {
  return (
    <div className="container w-full">
      <div className="grid grid-cols-1 flex-row flex-wrap gap-8 w-full">
        <a href="/chorder/" className="card bg-neutral shadow-2xl</div>">
          <div className="card-body items-center justify-center">
            <h2 className="card-title">Chorder</h2>
          </div>
        </a>
      </div>
      <div className="grid grid-cols-1 flex-row flex-wrap gap-8 w-full mt-8">
        <a href="/strudeler/" className="card bg-neutral shadow-2xl</div>">
          <div className="card-body items-center justify-center">
            <h2 className="card-title">Strudeler</h2>
          </div>
        </a>
      </div>
    </div>
  );
}

export default TopPage;
