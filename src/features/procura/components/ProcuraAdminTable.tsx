'use client';

import { CheckCircle2, FileText, XCircle } from 'lucide-react';
import Image from 'next/image';
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
import { LABELS } from '@/constants/Labels';
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

    newWindow.document.write(LABELS.COMMON.LOADING);

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
              <TableHead>{LABELS.PROCURA.ORGANIZATION}</TableHead>
              <TableHead>{LABELS.PROCURA.STATUS}</TableHead>
              <TableHead>{LABELS.COMMON.ACTIONS}</TableHead>
              <TableHead>{LABELS.PROCURA.EXPIRY}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentOrganizations.map(org => (
              <TableRow key={org.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {org.imageUrl
                      ? (
                          <Image
                            src={org.imageUrl}
                            alt={org.name}
                            width={24}
                            height={24}
                            className="size-6 rounded-full"
                          />
                        )
                      : (
                          <div className="flex size-6 items-center justify-center rounded-full bg-info/10 text-[10px] font-bold text-info">
                            GC
                          </div>
                        )}
                    <span className={org.id === GLOBAL_CREMONINI_ID ? 'font-bold text-info' : ''}>
                      {org.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {org.procura.hasPoA
                    ? (
                        <Badge variant="outline" className="gap-1 border-success text-success">
                          <CheckCircle2 className="size-3" />
                          {LABELS.PROCURA.UPLOADED}
                        </Badge>
                      )
                    : (
                        <Badge variant="outline" className="gap-1 border-destructive text-destructive">
                          <XCircle className="size-3" />
                          {LABELS.PROCURA.MISSING}
                        </Badge>
                      )}
                </TableCell>
                <TableCell>
                  {org.procura.hasPoA && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-info hover:text-info/80"
                      onClick={() => handleOpenDocument(org.id)}
                    >
                      <FileText className="size-4" />
                      {LABELS.PROCURA.VIEW_DOCUMENT}
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  {org.procura.isExpired
                    ? (
                        <span className="font-bold text-destructive">{LABELS.PROCURA.EXPIRED}</span>
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
                  {LABELS.PROCURA.NO_ORGS}
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
