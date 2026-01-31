import React from "react";

const Modal = ({ isOpen, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className="mb-4">{children}</div>
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          닫기
        </button>
      </div>
    </div>
  );
};

export default Modal;
