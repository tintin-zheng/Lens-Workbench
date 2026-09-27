import { archiveTask as archiveMockTask, borrow, borrowBatch as borrowMockBatch, borrowKit as borrowMockKit, completeOnboarding as completeMockOnboarding, createEquipment, createKit as createMockKit, createTask as createMockTask, deleteEquipment as deleteMockEquipment, deleteKit as deleteMockKit, deleteTask as deleteMockTask, interpretBorrowCommand as interpretMockBorrowCommand, joinTask as joinMockTask, leaveTask as leaveMockTask, listBorrowHistory, listEquipment, listKits as listMockKits, listMemberBorrowHistory, listMembers, listMyBorrowings, listTasks as listMockTasks, loginMember as loginMockMember, registerMember, removeMember as removeMockMember, returnAllBorrowings as returnAllMockBorrowings, returnBorrow, returnKit as returnMockKit, updateEquipment as updateMockEquipment, updateKit as updateMockKit, updateTask as updateMockTask } from './mockApi'
import type { BatchBorrowInput, BatchBorrowResult, BorrowCommandResult, BorrowRecord, Equipment, EquipmentInput, Kit, KitInput, Member, MemberLogin, SpeechToken, TaskInput, TeamTask } from './types'
// 部署后设 VITE_USE_MOCK_API=false，即改为请求 Azure Functions 的 /api 路由。
const useMockApi = import.meta.env.VITE_USE_MOCK_API !== 'false'
class ApiError extends Error { readonly status: number; constructor(message: string, status: number) { super(message); this.status = status } }
async function request<T>(path: string, options?: RequestInit): Promise<T> { const token = sessionStorage.getItem('adminToken'); const response = await fetch(`/api${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Member-Session': token } : {}), ...options?.headers } }); if (!response.ok) { const body = await response.json().catch(() => ({})); if (path !== '/members/login' && token && token === sessionStorage.getItem('adminToken') && (response.status === 401 || body.message?.includes('账户已停用'))) window.dispatchEvent(new Event('member-session-expired')); throw new ApiError(body.message ?? '请求失败', response.status) } return response.json() as Promise<T> }
export async function loginMember(name: string, password?: string): Promise<MemberLogin> {
  if (useMockApi) return loginMockMember(name, password)
  for (let attempt = 0; ; attempt += 1) {
    try { return await request('/members/login', { method: 'POST', body: JSON.stringify({ name, password }) }) }
    catch (error) { if (attempt >= 11 || !(error instanceof TypeError || error instanceof ApiError && error.status >= 500)) throw error; await new Promise((resolve) => window.setTimeout(resolve, 5000)) }
  }
}
export const completeOnboarding = (memberId: number): Promise<{ onboardingVersion: number }> => useMockApi ? completeMockOnboarding(memberId) : request('/members/onboarding', { method: 'POST' })
export const getMembers = (): Promise<Member[]> => useMockApi ? listMembers() : request('/members')
export const createMember = (name: string): Promise<Member> => useMockApi ? registerMember(name) : request('/members', { method: 'POST', body: JSON.stringify({ name }) })
export const deleteMember = (id: number): Promise<void> => useMockApi ? removeMockMember(id) : request(`/members/${id}`, { method: 'DELETE' })
export const getEquipment = (): Promise<Equipment[]> => useMockApi ? listEquipment() : request('/equipment')
export const addEquipment = (input: EquipmentInput): Promise<Equipment> => useMockApi ? createEquipment(input) : request('/equipment', { method: 'POST', body: JSON.stringify(input) })
export const updateEquipment = (id: number, input: EquipmentInput): Promise<Equipment> => useMockApi ? updateMockEquipment(id, input) : request(`/equipment/${id}`, { method: 'PATCH', body: JSON.stringify(input) })
export const getKits = (): Promise<Kit[]> => useMockApi ? listMockKits() : request('/kits')
export const createKit = (input: KitInput): Promise<Kit> => useMockApi ? createMockKit(input) : request('/kits', { method: 'POST', body: JSON.stringify(input) })
export const updateKit = (id: number, input: KitInput): Promise<Kit> => useMockApi ? updateMockKit(id, input) : request(`/kits/${id}`, { method: 'PATCH', body: JSON.stringify(input) })
export const deleteKit = (id: number): Promise<void> => useMockApi ? deleteMockKit(id) : request(`/kits/${id}`, { method: 'DELETE' })
export const borrowKit = (kitId: number, memberId: number): Promise<void> => useMockApi ? borrowMockKit(kitId, memberId) : request(`/kits/${kitId}/borrow`, { method: 'POST', body: JSON.stringify({ memberId }) })
export const returnKit = (kitBorrowRecordId: number, memberId: number): Promise<void> => useMockApi ? returnMockKit(kitBorrowRecordId, memberId) : request('/kits/return', { method: 'POST', body: JSON.stringify({ kitBorrowRecordId, memberId }) })
export const deleteEquipment = (id: number): Promise<void> => useMockApi ? deleteMockEquipment(id) : request(`/equipment/${id}`, { method: 'DELETE' })
export const getBorrowHistory = (): Promise<BorrowRecord[]> => useMockApi ? listBorrowHistory() : request('/borrow-records')
export const getMemberBorrowHistory = (memberId: number): Promise<BorrowRecord[]> => useMockApi ? listMemberBorrowHistory(memberId) : request(`/borrow-records?memberId=${memberId}`)
export const getMyBorrowings = (memberId: number): Promise<Equipment[]> => useMockApi ? listMyBorrowings(memberId) : request(`/borrow-records?memberId=${memberId}&active=true`)
export const borrowEquipment = (equipmentId: number, memberId: number) => useMockApi ? borrow(equipmentId, memberId) : request('/borrow', { method: 'POST', body: JSON.stringify({ equipmentId, memberId }) })
export const interpretBorrowCommand = (text: string): Promise<BorrowCommandResult> => useMockApi ? interpretMockBorrowCommand(text) : request('/borrow-command', { method: 'POST', body: JSON.stringify({ text }) })
export const borrowBatch = (input: BatchBorrowInput): Promise<BatchBorrowResult> => useMockApi ? borrowMockBatch(input) : request('/borrow-batch', { method: 'POST', body: JSON.stringify(input) })
export const getSpeechToken = (): Promise<SpeechToken> => request('/speech-token', { method: 'POST' })
export const returnEquipment = (borrowRecordId: number, memberId: number) => useMockApi ? returnBorrow(borrowRecordId, memberId) : request('/return', { method: 'POST', body: JSON.stringify({ borrowRecordId, memberId }) })
export const returnAllBorrowings = (memberId: number): Promise<void> => useMockApi ? returnAllMockBorrowings(memberId) : request('/return-all', { method: 'POST', body: JSON.stringify({ memberId }) })
export const getTasks = (archived = false): Promise<TeamTask[]> => useMockApi ? listMockTasks(archived) : request(`/tasks?archived=${archived}`)
export const createTask = (input: TaskInput, memberId: number): Promise<TeamTask> => useMockApi ? createMockTask(input, memberId) : request('/tasks', { method: 'POST', body: JSON.stringify({ ...input, memberId }) })
export const updateTask = (id: number, input: TaskInput): Promise<TeamTask> => useMockApi ? updateMockTask(id, input) : request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(input) })
export const joinTask = (id: number, memberId: number): Promise<void> => useMockApi ? joinMockTask(id, memberId) : request(`/tasks/${id}/participants`, { method: 'POST', body: JSON.stringify({ memberId }) })
export const leaveTask = (id: number, memberId: number): Promise<void> => useMockApi ? leaveMockTask(id, memberId) : request(`/tasks/${id}/participants/${memberId}`, { method: 'DELETE' })
export const archiveTask = (id: number): Promise<void> => useMockApi ? archiveMockTask(id) : request(`/tasks/${id}/archive`, { method: 'POST' })
export const deleteTask = (id: number): Promise<void> => useMockApi ? deleteMockTask(id) : request(`/tasks/${id}`, { method: 'DELETE' })
