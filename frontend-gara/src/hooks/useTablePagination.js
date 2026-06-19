import { useState, useMemo } from 'react';

export function useTablePagination(data, filterFn, itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(item => filterFn(item, searchTerm.toLowerCase()));
  }, [data, searchTerm, filterFn]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  
  const currentData = useMemo(() => {
    const start = (validCurrentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredData.slice(start, end);
  }, [filteredData, validCurrentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSearchChange = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  return {
    currentData,
    currentPage: validCurrentPage,
    totalPages,
    searchTerm,
    setSearchTerm: handleSearchChange,
    handlePageChange,
    totalItems: filteredData.length
  };
}
