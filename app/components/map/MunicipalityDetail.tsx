import type { MunicipalityData } from '@/types/map';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface MunicipalityDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  municipalityName: string;
  regionName: string;
  data: MunicipalityData | null;
}

export function MunicipalityDetail({
  open,
  onOpenChange,
  municipalityName,
  regionName,
  data,
}: MunicipalityDetailProps) {
  if (!data) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{municipalityName}</DialogTitle>
            <DialogDescription>{regionName}</DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center text-gray-500">
            No overpricing data available for this municipality.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-CL').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(2)}%`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{municipalityName}</DialogTitle>
          <DialogDescription className="text-base">{regionName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-gradient-to-r from-pink-50 to-cyan-50 rounded-lg p-6 border border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Overpricing Percentage</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-[#ED2472] to-[#68CCDB] bg-clip-text text-transparent">
                {formatPercentage(data.porcentaje_sobreprecio)}
              </p>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-2/3">Metric</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Overpriced Purchases</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(data.compras_caras)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Total Purchases</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(data.compras_totales)}
                  </TableCell>
                </TableRow>
                <TableRow className="bg-gray-50">
                  <TableCell className="font-medium">Overpricing Rate</TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {formatPercentage(data.porcentaje_sobreprecio)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Ratio</TableCell>
                  <TableCell className="text-right font-mono text-sm text-gray-600">
                    {data.compras_caras} / {data.compras_totales}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-gray-500 text-center">
            Data represents the percentage of purchases with overpricing issues
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
