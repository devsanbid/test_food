"use client"

import React from "react";
export default function NotFoundPage() {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-8">
            {/* 404 Number */}
            <div className="text-6xl font-light text-gray-900">
              404
            </div>
            
            {/* Vertical Divider */}
            <div className="h-16 w-px bg-gray-300"></div>
            
            {/* Error Message */}
            <div className="text-lg text-gray-600 font-normal">
              This page could not be found.
            </div>
          </div>
        </div>
      </div>
    );
  }