import { format } from 'date-fns';
import { arrears } from '@/lib/data';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ArrearsPage() {
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatDate = (dateString: string) => format(new Date(dateString), 'MMMM dd, yyyy');

  return (
    <>
      <PageHeader title="Arrears" />
      <Card>
        <CardHeader>
          <CardTitle>Tenants in Arrears</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Amount Owed</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {arrears.map((arrear, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{arrear.tenant}</TableCell>
                  <TableCell>{arrear.propertyAddress}</TableCell>
                  <TableCell>
                    <Badge variant="destructive">{formatDate(arrear.dueDate)}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-destructive">{formatCurrency(arrear.amount)}</TableCell>
                  <TableCell className="text-center">
                    <Button size="sm">Send Reminder</Button>
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
