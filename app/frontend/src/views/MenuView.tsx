import { useState } from 'react'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import WbTwilightIcon from '@mui/icons-material/WbTwilight'
import WbSunnyIcon from '@mui/icons-material/WbSunny'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import CookieIcon from '@mui/icons-material/Cookie'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import Typography from '@mui/material/Typography'
import DayDetailView from './DayDetailView'
import RecipeSelectorDialog from '../components/RecipeSelectorDialog'
import { useWeek, useCreateWeek, useAutofill, useClearSlot } from '../hooks/useMenu'
import { useProfile } from '../hooks/useProfile'
import type { MenuDay, MenuSlot, SlotType } from '../types/menu'

// ─── Constants ───────────────────────────────────────────────────────────────

const SLOT_ORDER: SlotType[] = [
  'desayuno',
  'media_manana',
  'comida',
  'merienda',
  'cena',
]

const SLOT_LABELS: Record<SlotType, string> = {
  desayuno: 'Desayuno',
  media_manana: 'M. Mañana',
  comida: 'Comida',
  merienda: 'Merienda',
  cena: 'Cena',
}

const SLOT_ICONS: Record<SlotType, typeof WbTwilightIcon> = {
  desayuno: WbTwilightIcon,
  media_manana: WbSunnyIcon,
  comida: RestaurantIcon,
  merienda: CookieIcon,
  cena: DarkModeIcon,
}

const DAY_SHORT = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE']

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getMondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addWeeks(isoDate: string, weeks: number): string {
  const d = new Date(isoDate + 'T00:00:00')
  d.setDate(d.getDate() + weeks * 7)
  return toISODate(d)
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 4)
  const dayMonth: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  return `${start.toLocaleDateString('es-ES', dayMonth)} – ${end.toLocaleDateString('es-ES', {
    ...dayMonth,
    year: 'numeric',
  })}`
}

// ─── Slot cell ────────────────────────────────────────────────────────────────

interface SlotCellProps {
  slot: MenuSlot | undefined
  onEmpty: () => void
  onFilled: (slot: MenuSlot) => void
}

function SlotCell({ slot, onEmpty, onFilled }: SlotCellProps) {
  if (!slot) return <Box sx={{ height: 96 }} />

  if (slot.recipe) {
    const hasPair = slot.second_recipe !== null
    return (
      <Box
        onClick={() => onFilled(slot)}
        sx={{
          height: 96,
          bgcolor: 'rgba(0,130,253,0.08)',
          border: '1px solid rgba(0,130,253,0.2)',
          borderRadius: '12px',
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: hasPair ? 'space-between' : 'center',
          cursor: 'pointer',
          transition: 'all 0.15s',
          gap: hasPair ? 0.5 : 0,
          '&:hover': { bgcolor: 'rgba(0,130,253,0.14)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
        }}
      >
        {hasPair && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Typography sx={{ fontSize: 9, fontWeight: 800, color: '#005cb2', minWidth: 14, mt: 0.1 }}>1°</Typography>
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 700,
                color: '#4da8ff',
                lineHeight: 1.3,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {slot.recipe.name}
            </Typography>
          </Box>
        )}
        {!hasPair && (
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              color: '#4da8ff',
              lineHeight: 1.3,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {slot.recipe.name}
          </Typography>
        )}
        {hasPair && slot.second_recipe && (
          <>
            <Box sx={{ borderTop: '1px solid rgba(0,130,253,0.15)', mx: -1.5 }} />
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
              <Typography sx={{ fontSize: 9, fontWeight: 800, color: '#005cb2', minWidth: 14, mt: 0.1 }}>2°</Typography>
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#4da8ff',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {slot.second_recipe.name}
              </Typography>
            </Box>
          </>
        )}
      </Box>
    )
  }

  return (
    <Box
      onClick={onEmpty}
      sx={{
        height: 96,
        border: '2px dashed #c3c7d0',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s',
        '&:hover': { bgcolor: '#eef2ff', borderColor: '#4da8ff' },
      }}
    >
      <AddIcon sx={{ color: '#c3c7d0', fontSize: 20 }} />
    </Box>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

function MenuView() {
  const [weekStart, setWeekStart] = useState<string>(() =>
    toISODate(getMondayOf(new Date())),
  )

  const [selectorOpen, setSelectorOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<MenuSlot | null>(null)
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null)
  const [infoSlot, setInfoSlot] = useState<MenuSlot | null>(null)
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null)

  const { data: week, isLoading, error } = useWeek(weekStart)
  const { data: profile } = useProfile()
  const createWeek = useCreateWeek()
  const autofill = useAutofill(weekStart)
  const clearSlot = useClearSlot(weekStart)

  const isNotFound = error instanceof Error && error.message.includes('No existe')

  const detailDay: MenuDay | null =
    selectedDayId !== null
      ? (week?.days.find((d) => d.id === selectedDayId) ?? null)
      : null

  function handlePrevWeek() {
    setWeekStart((w) => addWeeks(w, -1))
    setSelectedDayId(null)
  }

  function handleNextWeek() {
    setWeekStart((w) => addWeeks(w, 1))
    setSelectedDayId(null)
  }

  function handleCreateWeek() {
    createWeek.mutate(
      { week_start: weekStart },
      { onError: (err) => setSnack({ msg: (err as Error).message, severity: 'error' }) },
    )
  }

  function handleEmptyCellClick(slot: MenuSlot) {
    setSelectedSlot(slot)
    setSelectorOpen(true)
  }

  function handleFilledCellClick(slot: MenuSlot) {
    setInfoSlot(slot)
  }

  function handleInfoChange() {
    if (infoSlot) { setSelectedSlot(infoSlot); setSelectorOpen(true) }
    setInfoSlot(null)
  }

  function handleInfoClear() {
    if (infoSlot) {
      clearSlot.mutate(infoSlot.id, {
        onError: (err) => setSnack({ msg: (err as Error).message, severity: 'error' }),
      })
    }
    setInfoSlot(null)
  }

  function handleAutofill() {
    autofill.mutate(undefined, {
      onSuccess: () => setSnack({ msg: 'Menú rellenado correctamente', severity: 'success' }),
      onError: (err) => setSnack({ msg: (err as Error).message, severity: 'error' }),
    })
  }

  const days = week?.days ?? []

  return (
    <Box sx={{ pb: 2 }}>
      {/* ── Week selector bar ── */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: '#f0f4ff',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={handlePrevWeek}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.6)', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 700, color: '#1a1c1e', fontSize: 15 }}>
              {formatWeekRange(weekStart)}
            </Typography>
            <Typography sx={{ fontSize: 10, color: '#44464f', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
              Semana
            </Typography>
          </Box>
          <IconButton
            onClick={handleNextWeek}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.6)', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>

        <Button
          variant="contained"
          size="small"
          startIcon={autofill.isPending ? <CircularProgress size={14} color="inherit" /> : <AutoAwesomeIcon sx={{ fontSize: 16 }} />}
          onClick={handleAutofill}
          disabled={!week || autofill.isPending}
          sx={{
            bgcolor: '#5071d5',
            '&:hover': { bgcolor: '#3f5ab8' },
            '&.Mui-disabled': { bgcolor: '#c3c7d0', color: 'white' },
            borderRadius: 100,
            px: 2.5,
            py: 1,
            fontSize: 13,
            fontFamily: '"Inter", sans-serif',
            letterSpacing: '0.05em',
            boxShadow: '0 4px 12px rgba(80,113,213,0.3)',
          }}
        >
          AUTOFILL
        </Button>
      </Box>

      {/* ── Loading ── */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* ── Week not found ── */}
      {isNotFound && !isLoading && (
        <Box sx={{ px: 3, pt: 3 }}>
          <Alert
            severity="info"
            action={
              <Button size="small" onClick={handleCreateWeek} disabled={createWeek.isPending}>
                {createWeek.isPending ? <CircularProgress size={14} color="inherit" /> : 'Crear semana'}
              </Button>
            }
            sx={{ borderRadius: 3 }}
          >
            No hay menú creado para esta semana.
          </Alert>
        </Box>
      )}

      {error && !isNotFound && (
        <Box sx={{ px: 3, pt: 3 }}>
          <Alert severity="error" sx={{ borderRadius: 3 }}>{(error as Error).message}</Alert>
        </Box>
      )}

      {/* ── Weekly grid ── */}
      {week && (
        <Box
          sx={{
            overflowX: 'auto',
            px: 2,
            pt: 2,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Box sx={{ minWidth: 640 }}>
            {/* Day headers */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '88px repeat(5, 1fr)', mb: 1.5, gap: 1.5 }}>
              <Box />
              {days.map((day, idx) => {
                const d = new Date(day.day_date + 'T00:00:00')
                return (
                  <Box
                    key={day.id}
                    sx={{
                      textAlign: 'center',
                      cursor: 'pointer',
                      py: 0.5,
                      borderRadius: 2,
                      '&:hover': { bgcolor: '#eef2ff' },
                    }}
                    onClick={() => setSelectedDayId(day.id)}
                  >
                    <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#6a769e', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>
                      {DAY_SHORT[idx]}
                    </Typography>
                    <Typography sx={{ fontFamily: '"Inter", sans-serif', fontSize: 20, fontWeight: 800, color: '#1a1c1e', lineHeight: 1.2 }}>
                      {d.getDate()}
                    </Typography>
                  </Box>
                )
              })}
            </Box>

            {/* Slot rows */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {SLOT_ORDER.map((slotType) => {
                const SlotIcon = SLOT_ICONS[slotType]
                return (
                  <Box key={slotType} sx={{ display: 'grid', gridTemplateColumns: '88px repeat(5, 1fr)', gap: 1.5, alignItems: 'center' }}>
                    {/* Slot label */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6a769e' }}>
                      <SlotIcon sx={{ fontSize: 18 }} />
                      <Typography sx={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mt: 0.25, textAlign: 'center', lineHeight: 1.2 }}>
                        {SLOT_LABELS[slotType]}
                      </Typography>
                    </Box>

                    {/* Day cells */}
                    {days.map((day) => {
                      const slot = day.slots.find((s) => s.slot_type === slotType)
                      return (
                        <SlotCell
                          key={day.id}
                          slot={slot}
                          onEmpty={() => slot && handleEmptyCellClick(slot)}
                          onFilled={(s) => handleFilledCellClick(s)}
                        />
                      )
                    })}
                  </Box>
                )
              })}
            </Box>

            {/* Kcal progress footer */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '88px repeat(5, 1fr)', gap: 1.5, mt: 3, alignItems: 'flex-end' }}>
              <Box sx={{ textAlign: 'right', pr: 1 }}>
                <Typography sx={{ fontSize: 9, fontWeight: 900, color: '#44464f', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Kcal / día
                </Typography>
              </Box>
              {days.map((day) => {
                const target = profile?.kcal_target ?? 2000
                const pct = Math.min(100, (day.macros.kcal / target) * 100)
                const over = day.macros.kcal > target
                return (
                  <Box key={day.id} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ height: 8, bgcolor: '#dde3f0', borderRadius: 100, overflow: 'hidden' }}>
                      <Box
                        sx={{
                          height: '100%',
                          width: `${pct}%`,
                          bgcolor: over ? '#ba1a1a' : '#4da8ff',
                          borderRadius: 100,
                          transition: 'width 0.3s',
                        }}
                      />
                    </Box>
                    <Typography
                      sx={{
                        fontSize: 9,
                        fontWeight: 700,
                        textAlign: 'center',
                        color: over ? '#ba1a1a' : pct > 0 ? '#4da8ff' : '#6a769e',
                      }}
                    >
                      {pct > 0 ? `${Math.round(day.macros.kcal)}` : '0%'}
                    </Typography>
                  </Box>
                )
              })}
            </Box>
          </Box>
        </Box>
      )}

      {/* ── Recipe info dialog ── */}
      <Dialog
        open={Boolean(infoSlot)}
        onClose={() => setInfoSlot(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        {infoSlot?.recipe && (
          <DialogContent sx={{ p: 0 }}>
            {/* Image */}
            <Box sx={{ position: 'relative', height: 180, bgcolor: '#eef2ff', overflow: 'hidden' }}>
              {infoSlot.recipe.image_url ? (
                <Box
                  component="img"
                  src={infoSlot.recipe.image_url}
                  alt={infoSlot.recipe.name}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RestaurantIcon sx={{ fontSize: 56, color: '#c3c7d0' }} />
                </Box>
              )}
              <IconButton
                size="small"
                onClick={() => setInfoSlot(null)}
                sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: 'white' } }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{ px: 3, pt: 2.5, pb: 3 }}>
              {/* Name */}
              <Typography sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 800, fontSize: 18, color: '#1a1c1e', mb: 2 }}>
                {infoSlot.recipe.name}
              </Typography>

              {/* Macros */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                {[
                  { label: `${Math.round(infoSlot.recipe.kcal)} kcal`, bg: 'rgba(0,130,253,0.1)', color: '#4da8ff' },
                  { label: `P: ${Math.round(infoSlot.recipe.prot_g)}g`, bg: 'rgba(21,101,192,0.1)', color: '#1565C0' },
                  { label: `HC: ${Math.round(infoSlot.recipe.hc_g)}g`, bg: 'rgba(245,127,23,0.1)', color: '#F57F17' },
                  { label: `G: ${Math.round(infoSlot.recipe.fat_g)}g`, bg: 'rgba(198,40,40,0.1)', color: '#C62828' },
                ].map(({ label, bg, color }) => (
                  <Box key={label} sx={{ bgcolor: bg, color, px: 1.5, py: 0.5, borderRadius: 1.5, fontSize: 12, fontWeight: 700, fontFamily: '"Inter", sans-serif' }}>
                    {label}
                  </Box>
                ))}
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Actions */}
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleInfoChange}
                  sx={{ borderRadius: 100, textTransform: 'none', fontFamily: '"Inter", sans-serif', fontWeight: 700 }}
                >
                  Cambiar
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={handleInfoClear}
                  sx={{ borderRadius: 100, textTransform: 'none', fontFamily: '"Inter", sans-serif', fontWeight: 700 }}
                >
                  Quitar
                </Button>
              </Box>
            </Box>
          </DialogContent>
        )}
      </Dialog>

      {/* ── Recipe selector ── */}
      {selectedSlot && (
        <RecipeSelectorDialog
          open={selectorOpen}
          onClose={() => { setSelectorOpen(false); setSelectedSlot(null) }}
          slotId={selectedSlot.id}
          slotType={selectedSlot.slot_type}
          weekStart={weekStart}
          currentSlot={selectedSlot}
        />
      )}

      {/* ── Day detail ── */}
      {detailDay && (
        <DayDetailView
          open={Boolean(detailDay)}
          onClose={() => setSelectedDayId(null)}
          day={detailDay}
          weekStart={weekStart}
        />
      )}

      {/* ── Snackbar ── */}
      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snack ? (
          <Alert severity={snack.severity} onClose={() => setSnack(null)} sx={{ width: '100%', borderRadius: 3 }}>
            {snack.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  )
}

export default MenuView
