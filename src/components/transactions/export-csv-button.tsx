"use client";

import { useState } from "react";
import { Check, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { csvFilename, transactionsToCSV } from "@/lib/csv";
import type { Transaction } from "@/lib/types";

/**
 * Gera o CSV no próprio navegador a partir das transações já filtradas —
 * o que você vê na tela é exatamente o que sai no arquivo.
 */
export function ExportCsvButton({ transactions }: { transactions: Transaction[] }) {
  const [done, setDone] = useState(false);
  const disabled = transactions.length === 0;

  function handleExport() {
    const blob = new Blob([transactionsToCSV(transactions)], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = csvFilename();
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setDone(true);
    setTimeout(() => setDone(false), 2000);
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={disabled}
      title={
        disabled
          ? "Não há transações no filtro atual para exportar"
          : `Exportar ${transactions.length} transação(ões) em CSV`
      }
    >
      {done ? <Check className="size-4 text-success" /> : <Download className="size-4" />}
      {done ? "Baixado" : "Exportar CSV"}
    </Button>
  );
}
