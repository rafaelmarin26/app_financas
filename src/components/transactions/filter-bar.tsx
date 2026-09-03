"use client";

import { useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/categories";
import { MONTHS } from "@/lib/utils";
import type { TransactionFilters } from "@/lib/types";

const ALL = "todos";

export function FilterBar({
  filters,
  years,
  showType = true,
  showSearch = true,
}: {
  filters: TransactionFilters;
  years: number[];
  showType?: boolean;
  showSearch?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(filters.search);
  const [syncedSearch, setSyncedSearch] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mantém o campo em sincronia quando a URL muda por fora (ex.: "limpar filtros").
  // Ajustar o estado durante o render evita o render extra de um useEffect.
  if (syncedSearch !== filters.search) {
    setSyncedSearch(filters.search);
    setSearch(filters.search);
  }

  function pushParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  function setParam(key: string, value: string) {
    pushParams((params) => {
      if (value === ALL && key !== "ano" && key !== "mes") params.delete(key);
      else params.set(key, value);
    });
  }

  function onSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushParams((params) => {
        const term = value.trim();
        if (term) params.set("q", term);
        else params.delete("q");
      });
    }, 350);
  }

  const isFiltered =
    Boolean(filters.category) ||
    Boolean(filters.type) ||
    Boolean(filters.search) ||
    filters.year === null ||
    filters.month === null;

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {showSearch ? (
          <div className="relative lg:max-w-xs lg:flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar pela descrição…"
              aria-label="Buscar transações pela descrição"
              className="pl-9"
            />
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:flex-1 lg:justify-end">
          <Select
            value={filters.month === null ? ALL : String(filters.month)}
            onValueChange={(value) => setParam("mes", value)}
            disabled={filters.year === null}
          >
            <SelectTrigger aria-label="Filtrar por mês" className="lg:w-[9.5rem]">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Ano inteiro</SelectItem>
              {MONTHS.map((label, index) => (
                <SelectItem key={label} value={String(index + 1)}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.year === null ? ALL : String(filters.year)}
            onValueChange={(value) => setParam("ano", value)}
          >
            <SelectTrigger aria-label="Filtrar por ano" className="lg:w-[7.5rem]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
              <SelectItem value={ALL}>Todo o período</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.category ?? ALL}
            onValueChange={(value) => setParam("categoria", value)}
          >
            <SelectTrigger aria-label="Filtrar por categoria" className="lg:w-[10rem]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas as categorias</SelectItem>
              {CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {showType ? (
            <Select
              value={filters.type ?? ALL}
              onValueChange={(value) => setParam("tipo", value)}
            >
              <SelectTrigger aria-label="Filtrar por tipo" className="lg:w-[8.5rem]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Receitas e despesas</SelectItem>
                <SelectItem value="receita">Só receitas</SelectItem>
                <SelectItem value="despesa">Só despesas</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
        </div>

        <div className="flex items-center gap-2 lg:shrink-0">
          {isPending ? (
            <Loader2
              className="size-4 shrink-0 animate-spin text-muted-foreground"
              aria-label="Atualizando"
            />
          ) : null}
          {isFiltered ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startTransition(() => router.replace(pathname, { scroll: false }))}
            >
              <X className="size-4" />
              Limpar
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
