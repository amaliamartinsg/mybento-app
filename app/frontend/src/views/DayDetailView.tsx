import { useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import BoltIcon from '@mui/icons-material/Bolt'
import DeleteIcon from '@mui/icons-material/Delete'
import RemoveIcon from '@mui/icons-material/Remove'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import { getExtras } from '../api/extras'
import { useAddExtra, useRemoveExtra, useUpdateDayExtra } from '../hooks/useMenu'
import { useProfile } from '../hooks/useProfile'
import type { Extra } from '../types/extra'
import type { MenuDay, SlotType } from '../types/menu'

const SLOT_LABELS: Record<SlotType, string> = {
  desayuno: 'Desayuno',
  media_manana: 'Media mañana',
  comida: 'Comida',
  merienda: 'Merienda',
  cena: 'Cena',
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

interface Props {
  open: boolean
  onClose: () => void
  day: MenuDay
  weekStart: string
}

function DayDetailView({ open, onClose, day, weekStart }: Props) {
  const { data: profile } = useProfile()
  const addExtra = useAddExtra(weekStart)
  const removeExtra = useRemoveExtra(weekStart)
  const updateDayExtra = useUpdateDayExtra(weekStart)

  const [extrasPickerOpen, setExtrasPickerOpen] = useState(false)
  const [pickerGrams, setPickerGrams] = useState<Record<number, number>>({})

  const { data: allExtras, isLoading: loadingExtras } = useQuery({
    queryKey: ['extras'],
    queryFn: getExtras,
    enabled: extrasPickerOpen,
  })

  function handleQuantityChange(extraId: number, delta: number, fallbackGrams: number) {
    setPickerGrams((prev) => {
      const current = prev[extraId] ?? fallbackGrams
      return { ...prev, [extraId]: Math.max(5, current + delta) }
    })
  }

  function handleAddExtra(extra: Extra) {
    const grams = pickerGrams[extra.id] ?? extra.serving_g
    addExtra.mutate(
      { dayId: day.id, payload: { extra_id: extra.id, grams } },
      { onSuccess: () => setExtrasPickerOpen(false) },
    )
  }

  function handleUpdateConsumedGrams(dayExtraId: number, currentGrams: number, delta: number) {
    updateDayExtra.mutate({
      dayExtraId,
      grams: Math.max(5, currentGrams + delta),
    })
  }

  const kcalTarget = profile?.kcal_target ?? 2200
  const protTarget = profile?.prot_g_target ?? 165
  const hcTarget = profile?.hc_g_target ?? 248
  const fatTarget = profile?.fat_g_target ?? 61

  const kcalPct = Math.min(100, (day.macros.kcal / kcalTarget) * 100)
  const protPct = Math.min(100, (day.macros.prot_g / protTarget) * 100)
  const hcPct = Math.min(100, (day.macros.hc_g / hcTarget) * 100)
  const fatPct = Math.min(100, (day.macros.fat_g / fatTarget) * 100)

  return (
    <>
      <Dialog open={open} onClose={onClose} fullScreen>
        {/* Top bar */}
        <AppBar
          sx={{
            position: 'relative',
            bgcolor: '#005cb2',
            boxShadow: 'none',
          }}
        >
          <Toolbar sx={{ height: 56, minHeight: '56px !important', px: 2 }}>
            <IconButton edge="start" color="inherit" onClick={onClose} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography
              sx={{
                flex: 1,
                fontFamily: '"Inter", sans-serif',
                fontWeight: 700,
                fontSize: 18,
                textTransform: 'capitalize',
                color: 'white',
              }}
            >
              {formatDate(day.day_date)}
            </Typography>
          </Toolbar>
        </AppBar>

        <Box
          sx={{
            bgcolor: '#f8f9ff',
            minHeight: '100%',
            px: 3,
            pt: 3,
            pb: 4,
            maxWidth: 640,
            mx: 'auto',
            width: '100%',
          }}
        >
          {/* ── Macro summary card ── */}
          <Box
            sx={{
              bgcolor: 'background.paper',
              borderRadius: '28px',
              p: 3,
              mb: 3,
              boxShadow: '0 4px 20px rgba(0,130,253,0.04)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography sx={{ color: '#44464f', fontWeight: 500, fontSize: 14, mb: 0.5 }}>
                  Resumen del día
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                  <Typography
                    sx={{
                      fontFamily: '"Inter", sans-serif',
                      fontWeight: 800,
                      fontSize: 36,
                      color: '#4da8ff',
                      lineHeight: 1,
                    }}
                  >
                    {Math.round(day.macros.kcal).toLocaleString('es-ES')}
                  </Typography>
                  <Typography sx={{ color: '#44464f', fontWeight: 500, fontSize: 14 }}>
                    / {kcalTarget.toLocaleString('es-ES')} kcal
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '16px',
                  bgcolor: '#005cb2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BoltIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
            </Box>

            {/* Main kcal bar */}
            <Box sx={{ height: 14, bgcolor: '#eef2ff', borderRadius: 100, overflow: 'hidden', mb: 3 }}>
              <Box
                sx={{
                  height: '100%',
                  width: `${kcalPct}%`,
                  background: 'linear-gradient(90deg, #4da8ff 0%, #005cb2 100%)',
                  borderRadius: 100,
                  transition: 'width 0.4s',
                }}
              />
            </Box>

            {/* Macro grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
              {[
                { label: 'Proteínas', value: day.macros.prot_g, pct: protPct, color: '#1565C0' },
                { label: 'Hidratos', value: day.macros.hc_g, pct: hcPct, color: '#F57F17' },
                { label: 'Grasas', value: day.macros.fat_g, pct: fatPct, color: '#C62828' },
              ].map(({ label, value, pct, color }) => (
                <Box key={label} sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#44464f' }}>
                      {label}
                    </Typography>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color }}>
                      {Math.round(value)}g
                    </Typography>
                  </Box>
                  <Box sx={{ height: 6, bgcolor: '#eef2ff', borderRadius: 100, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: color, borderRadius: 100, transition: 'width 0.4s' }} />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* ── Meals section ── */}
          <Typography sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 700, fontSize: 18, px: 1, mb: 2 }}>
            Comidas del día
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
            {day.slots.map((slot) => (
              slot.recipe ? (
                <Box
                  key={slot.id}
                  sx={{
                    bgcolor: 'background.paper',
                    borderRadius: '24px',
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  }}
                >
                  {/* Thumbnail */}
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '16px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      bgcolor: '#eef2ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {slot.recipe.image_url ? (
                      <Box
                        component="img"
                        src={slot.recipe.image_url}
                        alt={slot.recipe.name}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <RestaurantIcon sx={{ color: '#c3c7d0', fontSize: 28 }} />
                    )}
                  </Box>
                  {/* Info */}
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography sx={{ fontWeight: 700, color: '#1a1c1e', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                        {slot.recipe.name}
                      </Typography>
                      <Box sx={{ bgcolor: 'rgba(0,130,253,0.08)', color: '#4da8ff', px: 1.5, py: 0.5, borderRadius: 1.5, fontSize: 12, fontWeight: 700 }}>
                        {Math.round(slot.recipe.kcal)} kcal
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: 12, color: '#44464f', mb: 0.75 }}>
                      {SLOT_LABELS[slot.slot_type]}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#1565C0' }} />
                        <Typography sx={{ fontSize: 10, fontWeight: 700 }}>{Math.round(slot.recipe.prot_g)}g P</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#F57F17' }} />
                        <Typography sx={{ fontSize: 10, fontWeight: 700 }}>{Math.round(slot.recipe.hc_g)}g H</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box
                  key={slot.id}
                  sx={{
                    height: 80,
                    border: '2px dashed rgba(195,199,208,0.5)',
                    borderRadius: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#44464f',
                    gap: 0.5,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#f0f4ff' },
                  }}
                >
                  <AddIcon sx={{ fontSize: 28 }} />
                  <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Añadir {SLOT_LABELS[slot.slot_type]}
                  </Typography>
                </Box>
              )
            ))}
          </Box>

          {/* ── Extras section ── */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, mb: 2 }}>
            <Typography sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 700, fontSize: 18 }}>
              Extras del día
            </Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setExtrasPickerOpen(true)}
              sx={{
                bgcolor: 'rgba(0,130,253,0.08)',
                color: '#4da8ff',
                borderRadius: 100,
                px: 2,
                fontWeight: 700,
                '&:hover': { bgcolor: 'rgba(0,130,253,0.15)' },
              }}
            >
              Añadir
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {day.day_extras.length === 0 ? (
              <Typography sx={{ color: '#6a769e', fontSize: 14, px: 1 }}>
                No hay extras añadidos
              </Typography>
            ) : (
              day.day_extras.map((de) => (
                <Box
                  key={de.id}
                  sx={{
                    bgcolor: '#eef2ff',
                    borderRadius: '16px',
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: '#dde3f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                      }}
                    >
                      🍽️
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#1a1c1e' }}>
                        {de.name}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: '#44464f' }}>
                        {Math.round(de.grams)} g consumidos · {Math.round(de.kcal)} kcal
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        bgcolor: '#f8f9ff',
                        borderRadius: 100,
                        p: 0.5,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleUpdateConsumedGrams(de.id, de.grams, -5)}
                        disabled={updateDayExtra.isPending}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography sx={{ minWidth: 48, textAlign: 'center', fontWeight: 700, fontSize: 14 }}>
                        {Math.round(de.grams)}g
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleUpdateConsumedGrams(de.id, de.grams, 5)}
                        disabled={updateDayExtra.isPending}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => removeExtra.mutate(de.id)}
                      disabled={removeExtra.isPending}
                      sx={{ color: '#ba1a1a' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Dialog>

      {/* Extras picker */}
      <Dialog
        open={extrasPickerOpen}
        onClose={() => setExtrasPickerOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px', mx: 2 } }}
      >
        <DialogTitle sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 700 }}>
          Añadir extra
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          {loadingExtras && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          )}
          {!loadingExtras && allExtras?.length === 0 && (
            <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }} variant="body2">
              No hay extras definidos. Añade extras en Ajustes.
            </Typography>
          )}
          <List dense disablePadding>
            {allExtras?.map((extra, idx) => {
              const grams = pickerGrams[extra.id] ?? extra.serving_g
              const ratio = grams / extra.serving_g
              const kcal = extra.kcal * ratio
              const prot = extra.prot_g * ratio
              return (
                <Box key={extra.id}>
                  {idx > 0 && <Divider sx={{ my: 0.5 }} />}
                  <ListItem
                    secondaryAction={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {/* Qty control */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            bgcolor: '#f8f9ff',
                            borderRadius: 100,
                            p: 0.5,
                          }}
                        >
                          <IconButton size="small" onClick={() => handleQuantityChange(extra.id, -5, extra.serving_g)}>
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Typography sx={{ minWidth: 48, textAlign: 'center', fontWeight: 700, fontSize: 14 }}>
                            {grams}g
                          </Typography>
                          <IconButton size="small" onClick={() => handleQuantityChange(extra.id, 5, extra.serving_g)}>
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleAddExtra(extra)}
                          disabled={addExtra.isPending}
                          sx={{ ml: 0.5, borderRadius: 100, minWidth: 64, fontWeight: 700 }}
                        >
                          Añadir
                        </Button>
                      </Box>
                    }
                    sx={{ pr: 22 }}
                  >
                    <ListItemText
                      primary={extra.name}
                      secondary={`${Math.round(kcal)} kcal / ${Math.round(grams)}g · P: ${Math.round(prot)}g`}
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItem>
                </Box>
              )
            })}
          </List>
          {addExtra.isPending && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
              <CircularProgress size={20} />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default DayDetailView
