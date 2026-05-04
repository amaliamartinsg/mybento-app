import { useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCategory,
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
  getCategories,
  updateCategory,
  updateSubcategory,
} from '../../api/categories'
import type { Category, SubCategory } from '../../types/category'
import { sectionTitle } from './settingsStyles'

function CategoryRow({ category, onDeleted }: { category: Category; onDeleted: () => void }) {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [editingName, setEditingName] = useState<string | null>(null)
  const [newSubName, setNewSubName] = useState('')
  const [addingSubcat, setAddingSubcat] = useState(false)
  const [editingSubId, setEditingSubId] = useState<number | null>(null)
  const [editingSubName, setEditingSubName] = useState('')

  function invalidate() { queryClient.invalidateQueries({ queryKey: ['categories'] }) }

  const renameCat = useMutation({
    mutationFn: () => updateCategory(category.id, { name: editingName! }),
    onSuccess: () => { invalidate(); setEditingName(null) },
  })

  const deleteCat = useMutation({
    mutationFn: () => deleteCategory(category.id),
    onSuccess: () => { invalidate(); onDeleted() },
  })

  const addSub = useMutation({
    mutationFn: () => createSubcategory(category.id, { name: newSubName.trim() }),
    onSuccess: () => { invalidate(); setNewSubName(''); setAddingSubcat(false) },
  })

  const renameSub = useMutation({
    mutationFn: (sub: SubCategory) => updateSubcategory(sub.id, { name: editingSubName }),
    onSuccess: () => { invalidate(); setEditingSubId(null) },
  })

  const deleteSub = useMutation({
    mutationFn: (id: number) => deleteSubcategory(id),
    onSuccess: () => invalidate(),
  })

  return (
    <Box sx={{ bgcolor: '#f0f4ff', borderRadius: '16px', overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          bgcolor: expanded ? '#eef2ff' : '#f0f4ff',
          transition: 'background-color 0.2s',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              bgcolor: 'rgba(0,130,253,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4da8ff',
              fontSize: 18,
            }}
          >
            🍽️
          </Box>
          {editingName !== null ? (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flex: 1 }}>
              <TextField
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                size="small"
                fullWidth
                onKeyDown={(e) => e.key === 'Enter' && renameCat.mutate()}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: '10px' } }}
              />
              <Button size="small" onClick={() => renameCat.mutate()} disabled={!editingName.trim() || renameCat.isPending} sx={{ borderRadius: 100 }}>OK</Button>
            </Box>
          ) : (
            <Box>
              <Typography sx={{ fontWeight: 700, color: '#1a1c1e' }}>{category.name}</Typography>
              <Typography sx={{ fontSize: 12, color: '#6a769e' }}>
                {category.subcategories.map((s) => s.name).join(', ') || `${category.subcategories.length} subcategorías`}
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton size="small" onClick={() => setEditingName(editingName === null ? category.name : null)} sx={{ color: '#6a769e' }}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => deleteCat.mutate()} disabled={deleteCat.isPending} sx={{ color: '#6a769e', '&:hover': { color: '#ba1a1a' } }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => setExpanded((v) => !v)} sx={{ color: '#6a769e' }}>
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 2, pt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {category.subcategories.map((sub) => (
            <Box
              key={sub.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1,
                px: 2,
                bgcolor: 'rgba(255,255,255,0.6)',
                borderRadius: '10px',
              }}
            >
              {editingSubId === sub.id ? (
                <Box sx={{ display: 'flex', gap: 1, flex: 1, alignItems: 'center' }}>
                  <TextField
                    value={editingSubName}
                    onChange={(e) => setEditingSubName(e.target.value)}
                    size="small"
                    fullWidth
                    onKeyDown={(e) => e.key === 'Enter' && renameSub.mutate(sub)}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: '10px' } }}
                  />
                  <Button size="small" onClick={() => renameSub.mutate(sub)} disabled={!editingSubName.trim() || renameSub.isPending} sx={{ borderRadius: 100 }}>OK</Button>
                </Box>
              ) : (
                <>
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{sub.name}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.25 }}>
                    <IconButton size="small" onClick={() => { setEditingSubId(sub.id); setEditingSubName(sub.name) }} sx={{ color: '#6a769e' }}>
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => deleteSub.mutate(sub.id)} disabled={deleteSub.isPending} sx={{ color: '#6a769e', '&:hover': { color: '#ba1a1a' } }}>
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                </>
              )}
            </Box>
          ))}

          {addingSubcat ? (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                size="small"
                placeholder="Nombre subcategoría"
                autoFocus
                fullWidth
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSubName.trim()) addSub.mutate()
                  if (e.key === 'Escape') setAddingSubcat(false)
                }}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: '10px' } }}
              />
              <Button size="small" variant="contained" onClick={() => addSub.mutate()} disabled={!newSubName.trim() || addSub.isPending} sx={{ borderRadius: 100 }}>
                Añadir
              </Button>
              <Button size="small" onClick={() => setAddingSubcat(false)} sx={{ borderRadius: 100 }}>Cancelar</Button>
            </Box>
          ) : (
            <Button size="small" startIcon={<AddIcon />} onClick={() => setAddingSubcat(true)} sx={{ borderRadius: 100, alignSelf: 'flex-start', color: '#4da8ff' }}>
              Nueva subcategoría
            </Button>
          )}
        </Box>
      </Collapse>
    </Box>
  )
}

function CategoriesSection() {
  const queryClient = useQueryClient()
  const { data: categories, isLoading } = useQuery({ queryKey: ['categories'], queryFn: getCategories })
  const [newCatName, setNewCatName] = useState('')
  const [addingCat, setAddingCat] = useState(false)

  const addCat = useMutation({
    mutationFn: () => createCategory({ name: newCatName.trim() }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setNewCatName(''); setAddingCat(false) },
  })

  return (
    <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={sectionTitle}>Categorías</Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setAddingCat(true)}
          disabled={addingCat}
          sx={{ bgcolor: 'rgba(0,130,253,0.08)', color: '#4da8ff', borderRadius: 100, px: 2, fontWeight: 700, '&:hover': { bgcolor: 'rgba(0,130,253,0.15)' } }}
        >
          Nueva
        </Button>
      </Box>

      {addingCat && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', bgcolor: 'background.paper', p: 2, borderRadius: '16px' }}>
          <TextField
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            size="small"
            placeholder="Nombre categoría"
            autoFocus
            fullWidth
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newCatName.trim()) addCat.mutate()
              if (e.key === 'Escape') setAddingCat(false)
            }}
          />
          <Button size="small" variant="contained" onClick={() => addCat.mutate()} disabled={!newCatName.trim() || addCat.isPending} sx={{ borderRadius: 100 }}>
            Crear
          </Button>
          <Button size="small" onClick={() => setAddingCat(false)} sx={{ borderRadius: 100 }}>Cancelar</Button>
        </Box>
      )}

      {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={28} /></Box>}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {categories?.map((cat) => (
          <CategoryRow
            key={cat.id}
            category={cat}
            onDeleted={() => queryClient.invalidateQueries({ queryKey: ['categories'] })}
          />
        ))}
        {categories?.length === 0 && (
          <Typography sx={{ color: '#6a769e', fontSize: 14 }}>No hay categorías. Crea la primera.</Typography>
        )}
      </Box>
    </Box>
  )
}

export default CategoriesSection
