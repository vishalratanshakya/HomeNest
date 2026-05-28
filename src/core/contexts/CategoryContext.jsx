import React, { createContext, useContext, useState, useEffect } from 'react';
import { dummyCategories } from '../utils/dummyData';

const CategoryContext = createContext();

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('app_categories');
    return saved ? JSON.parse(saved) : dummyCategories;
  });

  useEffect(() => {
    localStorage.setItem('app_categories', JSON.stringify(categories));
  }, [categories]);

  const addCategory = (category) => {
    const isDuplicate = categories.some(
      (c) => c.name.toLowerCase() === category.name.toLowerCase()
    );

    if (isDuplicate) {
      throw new Error('Category already exists');
    }

    const newCategory = {
      ...category,
      id: category.name.toLowerCase().replace(/\s+/g, '-'),
      count: 0,
      icon: category.icon || '🏠', // Default icon
    };

    setCategories((prev) => [...prev, newCategory]);
    return newCategory;
  };

  const deleteCategory = (id) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCategory = (id, updatedData) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c))
    );
  };

  return (
    <CategoryContext.Provider value={{ categories, addCategory, deleteCategory, updateCategory }}>
      {children}
    </CategoryContext.Provider>
  );
};
