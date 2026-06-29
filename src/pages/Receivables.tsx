import React, { useMemo, useState } from 'react';
import { useDB } from '@/hooks/useDB';
import { getOverdueReceivables } from '@/domain/services/receivableService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { AlertCircle, Calendar, ChevronDown, ChevronRight, DollarSign, Search, TrendingUp, User } from 'lucide-react';

export default function Receivables() {
  const { db } = useDB();
  const [search, setSearch] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const overdueData = useMemo(() => {
    const data = getOverdueReceivables(db);
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((c) => c.name.toLowerCase().includes(q));
  }, [db, search]);

  const totalOverdue = overdueData.reduce((sum, c) => sum + c.totalOverdue, 0);
  const customerCount = overdueData.length;
  const avgDays =
    overdueData.length > 0
      ? Math.round(
          overdueData.reduce((s, c) => {
            const days = Math.ceil((Date.now() - new Date(c.oldestDebtDate).getTime()) / (1000 * 60 * 60 * 24));
            return s + days;
          }, 0) / overdueData.length,
        )
      : 0;
  const totalCariBalance = overdueData.reduce((sum, c) => sum + c.totalCariBalance, 0);

  const toggleRow = (cariId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(cariId)) next.delete(cariId);
      else next.add(cariId);
      return next;
    });
  };

  if (overdueData.length === 0 && !search) {
    return (
      <div className="p-6">
        <Empty>
          <EmptyTitle>Gecikmiş Alacak Yok</EmptyTitle>
          <EmptyDescription>Tüm cari hesaplar güncel. Harika bir tahsilat performansı!</EmptyDescription>
        </Empty>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Alacak Takip Merkezi</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gecikmiş Alacak</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalOverdue.toLocaleString()} ₺</div>
            <p className="text-xs text-muted-foreground">{customerCount} müşteride</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Gecikme</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{avgDays} gün</div>
            <p className="text-xs text-muted-foreground">En eski borca göre</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Müşteri Sayısı</CardTitle>
            <User className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{customerCount}</div>
            <p className="text-xs text-muted-foreground">Gecikmesi olan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Cari Bakiye</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalCariBalance.toLocaleString()} ₺</div>
            <p className="text-xs text-muted-foreground">Bu müşterilerin toplam bakiyesi</p>
          </CardContent>
        </Card>
      </div>

      {totalOverdue > 10000 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Kritik Tahsilat Riski</AlertTitle>
          <AlertDescription>
            Toplam gecikmiş alacaklar 10.000 ₺ üzerine çıktı. Tahsilat süreçlerini hızlandırmanız önerilir.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Müşteri ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gecikmiş Borçlar Listesi</CardTitle>
          <CardDescription>Vade tarihi geçen müşteriler ve detaylı borç dökümü</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Müşteri</TableHead>
                <TableHead>Gecikmiş Tutar</TableHead>
                <TableHead>En Eski Borç</TableHead>
                <TableHead className="text-right">Gecikme</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overdueData.map((customer) => {
                const isExpanded = expandedRows.has(customer.cariId);
                const oldestDays = Math.ceil(
                  (Date.now() - new Date(customer.oldestDebtDate).getTime()) / (1000 * 60 * 60 * 24),
                );
                return (
                  <React.Fragment key={customer.cariId}>
                    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleRow(customer.cariId)}>
                      <TableCell>
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {customer.name}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-red-600">
                        {customer.totalOverdue.toLocaleString()} ₺
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(customer.oldestDebtDate).toLocaleDateString('tr-TR')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={oldestDays > 90 ? 'destructive' : oldestDays > 30 ? 'secondary' : 'outline'}>
                          {oldestDays} Gün
                        </Badge>
                      </TableCell>
                    </TableRow>
                    {isExpanded &&
                      customer.overdueSales.map((sale) => (
                        <TableRow key={sale.saleId} className="bg-muted/20">
                          <TableCell />
                          <TableCell className="pl-12 text-sm text-muted-foreground" colSpan={1}>
                            #{sale.saleId.slice(-6)}
                          </TableCell>
                          <TableCell className="text-sm">{sale.amount.toLocaleString()} ₺</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            Vade: {new Date(sale.dueDate).toLocaleDateString('tr-TR')}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            <Badge
                              variant={
                                sale.daysOverdue > 90 ? 'destructive' : sale.daysOverdue > 30 ? 'secondary' : 'outline'
                              }
                            >
                              {sale.daysOverdue} gün
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold">{children}</h3>;
}
function EmptyDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center h-[400px] text-center p-8 border-2 border-dashed rounded-lg">
      {children}
    </div>
  );
}
