import Image from 'next/image';
import { MoreHorizontal } from 'lucide-react';
import { properties } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PropertiesPage() {
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  return (
    <>
      <PageHeader title="Properties">
        <Button>Add Property</Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Property Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Current Value</TableHead>
                <TableHead className="hidden md:table-cell">Rental Value</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt="Property image"
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={property.imageUrl}
                      width="64"
                      data-ai-hint={property.imageHint}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{property.address}</TableCell>
                  <TableCell>{formatCurrency(property.currentValue)}</TableCell>
                  <TableCell className="hidden md:table-cell">{formatCurrency(property.rentalValue)}/month</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
