import { Pagination as ShadcnPagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <ShadcnPagination>
      <PaginationContent>
        <PaginationItem>
          {currentPage > 1 && (
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onPageChange(currentPage - 1);
              }}
            />
          )}
        </PaginationItem>
        {pages.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onPageChange(page);
              }}
              isActive={currentPage === page}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          {currentPage < totalPages && (
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onPageChange(currentPage + 1);
              }}
            />
          )}
        </PaginationItem>
      </PaginationContent>
    </ShadcnPagination>
  );
};