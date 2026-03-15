import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'

interface MacroRow {
  label: string
  current: number
  target: number
  color: string
  unit: string
}

interface MacroProgressBarProps {
  kcal: number
  prot_g: number
  hc_g: number
  fat_g: number
  kcal_target: number
  prot_g_target: number
  hc_g_target: number
  fat_g_target: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function MacroProgressBar({
  kcal,
  prot_g,
  hc_g,
  fat_g,
  kcal_target,
  prot_g_target,
  hc_g_target,
  fat_g_target,
}: MacroProgressBarProps) {
  const rows: MacroRow[] = [
    { label: 'Calorías', current: kcal, target: kcal_target, color: '#FF7043', unit: 'kcal' },
    { label: 'Proteína', current: prot_g, target: prot_g_target, color: '#42A5F5', unit: 'g' },
    { label: 'Hidratos', current: hc_g, target: hc_g_target, color: '#66BB6A', unit: 'g' },
    { label: 'Grasas', current: fat_g, target: fat_g_target, color: '#FFA726', unit: 'g' },
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {rows.map(({ label, current, target, color, unit }) => {
        const pct = target > 0 ? clamp((current / target) * 100, 0, 100) : 0
        return (
          <Box key={label}>
            <LinearProgress
              variant="determinate"
              value={pct}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.25 }}>
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.round(current)} / {Math.round(target)} {unit}
              </Typography>
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

export default MacroProgressBar
