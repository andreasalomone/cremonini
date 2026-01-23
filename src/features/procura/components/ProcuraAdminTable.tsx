'use client';

import { CheckCircle2, FileText, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { OrganizationProcuraStatus } from '@/features/procura/actions/procura.actions';
import { getProcura } from '@/features/procura/actions/procura.actions';

import { GLOBAL_CREMONINI_ID } from '../constants';

type ProcuraAdminTableProps = {
  organizations: OrganizationProcuraStatus[];
};

const ITEMS_PER_PAGE = 10;

export const ProcuraAdminTable = ({ organizations }: ProcuraAdminTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(organizations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentOrganizations = organizations.slice(startIndex, endIndex);

  const handleOpenDocument = async (orgId: string) => {
    // Open window immediately to bypass popup blockers
    const newWindow = window.open('', '_blank');

    if (!newWindow) {
      toast.error('Popup blocked. Please allow popups for this site.');
      return;
    }

    newWindow.document.write('Loading document...');

    try {
      const procura = await getProcura(orgId);
      if (procura?.documentUrl) {
        newWindow.location.href = procura.documentUrl;
      } else {
        newWindow.close();
        if (procura?.documentPath) {
          toast.warning('Document path found but direct URL opening not implemented.');
        } else {
          toast.error('Document not found');
        }
      }
    } catch (error) {
      console.error('Failed to open document', error);
      newWindow.close();
      toast.error('Failed to open document');
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Procura Status</TableHead>
              <TableHead>Actions</TableHead>
              <TableHead>Expiry</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentOrganizations.map(org => (
              <TableRow key={org.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {org.imageUrl
                      ? (
                          <img
                            src={org.imageUrl}
                            alt={org.name}
                            className="size-6 rounded-full"
                          />
                        )
                      : (
                          <div className="flex size-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                            GC
                          </div>
                        )}
                    <span className={org.id === GLOBAL_CREMONINI_ID ? 'font-bold text-blue-700' : ''}>
                      {org.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {org.procura.hasPoA
                    ? (
                        <Badge variant="outline" className="gap-1 border-green-500 text-green-500">
                          <CheckCircle2 className="size-3" />
                          Uploaded
                        </Badge>
                      )
                    : (
                        <Badge variant="outline" className="gap-1 border-red-500 text-red-500">
                          <XCircle className="size-3" />
                          Missing
                        </Badge>
                      )}
                </TableCell>
                <TableCell>
                  {org.procura.hasPoA && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-blue-600 hover:text-blue-800"
                      onClick={() => handleOpenDocument(org.id)}
                    >
                      <FileText className="size-4" />
                      View Document
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  {org.procura.isExpired
                    ? (
                        <span className="font-bold text-red-500">Expired</span>
                      )
                    : (
                        <span className="text-muted-foreground">-</span>
                      )}
                </TableCell>
              </TableRow>
            ))}
            {currentOrganizations.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No organizations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) {
                    setCurrentPage(p => p - 1);
                  }
                }}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  isActive={page === currentPage}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(page);
                  }}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) {
                    setCurrentPage(p => p + 1);
                  }
                }}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};
