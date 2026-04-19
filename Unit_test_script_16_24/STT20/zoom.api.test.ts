/**
 * STT 21 — Unit tests for elearning-frontend/src/apis/zoom.ts
 * 25 test cases covering all Zoom API wrapper functions
 */

jest.mock('@/config/axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import axiosRequest from '@/config/axios';
import {
  getZoomMeetings,
  getZoomMeetingById,
  createZoomMeeting,
  updateZoomMeeting,
  deleteZoomMeeting,
} from '@/apis/zoom';
import { ZoomMeeting, CreateZoomMeetingRequest, UpdateZoomMeetingRequest } from '@/apis/zoom';

const mockAxios = axiosRequest as jest.Mocked<typeof axiosRequest>;

beforeEach(() => jest.clearAllMocks());

// ==================== NHÓM A — getZoomMeetings ====================

describe('Nhóm A — getZoomMeetings', () => {
  // TC_ZOOM_API_01
  it('TC_ZOOM_API_01: Không filter → params={}', async () => {
    const mockResponse = { message: 'ok', result: [] };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getZoomMeetings();

    expect(mockAxios.get).toHaveBeenCalledWith('/zoom/meetings', { params: {} });
    expect(result).toBe(mockResponse);
  });

  // TC_ZOOM_API_02
  it('TC_ZOOM_API_02: Có courseId=5 → params={courseId:5}', async () => {
    const mockResponse = { message: 'ok', result: [] };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getZoomMeetings(5);

    expect(mockAxios.get).toHaveBeenCalledWith('/zoom/meetings', { params: { courseId: 5 } });
    expect(result).toBe(mockResponse);
  });

  // TC_ZOOM_API_03
  it('TC_ZOOM_API_03: courseId=0 → truthy check: params={} (bug tiềm tàng)', async () => {
    const mockResponse = { message: 'ok', result: [] };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getZoomMeetings(0);

    // BUG: courseId=0 bị coi là falsy → params={}
    expect(mockAxios.get).toHaveBeenCalledWith('/zoom/meetings', { params: {} });
    expect(result).toBe(mockResponse);
  });

  // TC_ZOOM_API_04
  it('TC_ZOOM_API_04: Response array preserve', async () => {
    const meeting1: ZoomMeeting = {
      id: 1,
      courseId: 5,
      teacherId: 10,
      title: 'Meeting 1',
      durationMinutes: 60,
      status: 'SCHEDULED',
      createdAt: '2025-01-15T10:00:00Z',
    };
    const meeting2: ZoomMeeting = {
      id: 2,
      courseId: 5,
      teacherId: 11,
      title: 'Meeting 2',
      durationMinutes: 45,
      status: 'STARTED',
      createdAt: '2025-01-16T10:00:00Z',
    };
    const mockResponse = { message: 'ok', result: [meeting1, meeting2] };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getZoomMeetings(5);

    expect(result.result.length).toBe(2);
    expect(result.result[0]).toEqual(meeting1);
    expect(result.result[1]).toEqual(meeting2);
  });
});

// ==================== NHÓM B — getZoomMeetingById ====================

describe('Nhóm B — getZoomMeetingById', () => {
  // TC_ZOOM_API_05
  it('TC_ZOOM_API_05: GET /zoom/meetings/:id', async () => {
    const mockResponse = { message: 'ok', result: { id: 42, title: 'Test Meeting' } };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getZoomMeetingById(42);

    expect(mockAxios.get).toHaveBeenCalledWith('/zoom/meetings/42');
    expect(result).toBe(mockResponse);
  });

  // TC_ZOOM_API_06
  it('TC_ZOOM_API_06: Response preserve đủ field (startUrl, joinUrl, meetingPassword)', async () => {
    const mockMeeting: ZoomMeeting = {
      id: 42,
      courseId: 5,
      teacherId: 10,
      title: 'Test Meeting',
      description: 'Description',
      zoomMeetingId: 'zoom-123',
      joinUrl: 'https://zoom.us/j/123',
      startUrl: 'https://zoom.us/s/123',
      meetingPassword: 'abc123',
      scheduledTime: '2025-01-15T10:00:00Z',
      durationMinutes: 60,
      status: 'SCHEDULED',
      createdAt: '2025-01-10T10:00:00Z',
    };
    const mockResponse = { message: 'ok', result: mockMeeting };
    mockAxios.get.mockResolvedValue(mockResponse);

    const result = await getZoomMeetingById(42);

    expect(result.result.startUrl).toBe('https://zoom.us/s/123');
    expect(result.result.joinUrl).toBe('https://zoom.us/j/123');
    expect(result.result.meetingPassword).toBe('abc123');
  });

  // TC_ZOOM_API_07
  it('TC_ZOOM_API_07: 404 khi meeting không tồn tại', async () => {
    const error = new Error('Not Found');
    (error as any).response = { status: 404 };
    mockAxios.get.mockRejectedValue(error);

    await expect(getZoomMeetingById(999)).rejects.toEqual(error);
    expect(mockAxios.get).toHaveBeenCalledWith('/zoom/meetings/999');
  });
});

// ==================== NHÓM C — createZoomMeeting ====================

describe('Nhóm C — createZoomMeeting', () => {
  // TC_ZOOM_API_08
  it('TC_ZOOM_API_08: POST /zoom/meetings với body đầy đủ', async () => {
    const requestBody: CreateZoomMeetingRequest = {
      courseId: 5,
      teacherId: 10,
      title: 'New Meeting',
      description: 'Description',
      joinUrl: 'https://zoom.us/j/123',
      zoomMeetingId: 'zoom-123',
      meetingPassword: 'abc123',
      scheduledTime: '2025-01-15T10:00:00Z',
      durationMinutes: 60,
    };
    const mockResponse = { message: 'ok', result: { id: 1, ...requestBody, status: 'SCHEDULED', createdAt: '2025-01-10T10:00:00Z' } };
    mockAxios.post.mockResolvedValue(mockResponse);

    const result = await createZoomMeeting(requestBody);

    expect(mockAxios.post).toHaveBeenCalledWith('/zoom/meetings', requestBody);
    expect(result).toBe(mockResponse);
  });

  // TC_ZOOM_API_09
  it('TC_ZOOM_API_09: Body nguyên vẹn — không mutate input', async () => {
    const requestBody: CreateZoomMeetingRequest = {
      courseId: 5,
      teacherId: 10,
      title: 'New Meeting',
      joinUrl: 'https://zoom.us/j/123',
      durationMinutes: 60,
    };
    const originalBody = JSON.parse(JSON.stringify(requestBody));
    const mockResponse = { message: 'ok', result: { id: 1 } };
    mockAxios.post.mockResolvedValue(mockResponse);

    await createZoomMeeting(requestBody);

    expect(requestBody).toEqual(originalBody);
  });

  // TC_ZOOM_API_10
  it('TC_ZOOM_API_10: scheduledTime là ISO string — passthrough không convert', async () => {
    const requestBody: CreateZoomMeetingRequest = {
      courseId: 5,
      teacherId: 10,
      title: 'New Meeting',
      joinUrl: 'https://zoom.us/j/123',
      scheduledTime: '2025-01-15T10:00:00Z',
      durationMinutes: 60,
    };
    const mockResponse = { message: 'ok', result: { id: 1 } };
    mockAxios.post.mockResolvedValue(mockResponse);

    await createZoomMeeting(requestBody);

    const callArgs = mockAxios.post.mock.calls[0] as [string, CreateZoomMeetingRequest];
    expect(callArgs[1].scheduledTime).toBe('2025-01-15T10:00:00Z');
  });

  // TC_ZOOM_API_11
  it('TC_ZOOM_API_11: durationMinutes giữ type number', async () => {
    const requestBody: CreateZoomMeetingRequest = {
      courseId: 5,
      teacherId: 10,
      title: 'New Meeting',
      joinUrl: 'https://zoom.us/j/123',
      durationMinutes: 60,
    };
    const mockResponse = { message: 'ok', result: { id: 1 } };
    mockAxios.post.mockResolvedValue(mockResponse);

    await createZoomMeeting(requestBody);

    const callArgs = mockAxios.post.mock.calls[0] as [string, CreateZoomMeetingRequest];
    expect(typeof callArgs[1].durationMinutes).toBe('number');
    expect(callArgs[1].durationMinutes).toBe(60);
  });

  // TC_ZOOM_API_12
  it('TC_ZOOM_API_12: meetingPassword nằm trong BODY, không trong URL', async () => {
    const requestBody: CreateZoomMeetingRequest = {
      courseId: 5,
      teacherId: 10,
      title: 'New Meeting',
      joinUrl: 'https://zoom.us/j/123',
      meetingPassword: 'secret123',
      durationMinutes: 60,
    };
    const mockResponse = { message: 'ok', result: { id: 1 } };
    mockAxios.post.mockResolvedValue(mockResponse);

    await createZoomMeeting(requestBody);

    const callArgs = mockAxios.post.mock.calls[0] as [string, CreateZoomMeetingRequest];
    // URL không chứa password
    expect(callArgs[0]).toBe('/zoom/meetings');
    expect(callArgs[0]).not.toContain('secret123');
    // Password chỉ trong body
    expect(callArgs[1].meetingPassword).toBe('secret123');
  });

  // TC_ZOOM_API_13
  it('TC_ZOOM_API_13: meetingPassword không bị log/leak trong params', async () => {
    const requestBody: CreateZoomMeetingRequest = {
      courseId: 5,
      teacherId: 10,
      title: 'New Meeting',
      joinUrl: 'https://zoom.us/j/123',
      meetingPassword: 'secret123',
      durationMinutes: 60,
    };
    const mockResponse = { message: 'ok', result: { id: 1 } };
    mockAxios.post.mockResolvedValue(mockResponse);

    await createZoomMeeting(requestBody);

    const callArgs = mockAxios.post.mock.calls[0];
    // post() chỉ có 2 args: URL và body
    expect(callArgs.length).toBe(2);
    // Password chỉ xuất hiện trong body (args[1])
    expect(JSON.stringify(callArgs[1])).toContain('secret123');
    // URL không chứa password
    expect(callArgs[0]).not.toContain('secret123');
  });

  // TC_ZOOM_API_14
  it('TC_ZOOM_API_14: courseId sai → BE trả 400, wrapper propagate', async () => {
    const error = new Error('Bad Request');
    (error as any).response = { status: 400 };
    mockAxios.post.mockRejectedValue(error);

    const requestBody: CreateZoomMeetingRequest = {
      courseId: 99999,
      teacherId: 10,
      title: 'New Meeting',
      joinUrl: 'https://zoom.us/j/123',
      durationMinutes: 60,
    };

    await expect(createZoomMeeting(requestBody)).rejects.toEqual(error);
  });

  // TC_ZOOM_API_15
  it('TC_ZOOM_API_15: teacherId không thuộc course → 403, propagate', async () => {
    const error = new Error('Forbidden');
    (error as any).response = { status: 403 };
    mockAxios.post.mockRejectedValue(error);

    const requestBody: CreateZoomMeetingRequest = {
      courseId: 5,
      teacherId: 999,
      title: 'New Meeting',
      joinUrl: 'https://zoom.us/j/123',
      durationMinutes: 60,
    };

    await expect(createZoomMeeting(requestBody)).rejects.toEqual(error);
  });
});

// ==================== NHÓM D — updateZoomMeeting ====================

describe('Nhóm D — updateZoomMeeting', () => {
  // TC_ZOOM_API_16
  it('TC_ZOOM_API_16: PUT /zoom/meetings/:id', async () => {
    const requestBody: UpdateZoomMeetingRequest = { title: 'new' };
    const mockResponse = { message: 'ok', result: { id: 42, title: 'new' } };
    mockAxios.put.mockResolvedValue(mockResponse);

    const result = await updateZoomMeeting(42, requestBody);

    expect(mockAxios.put).toHaveBeenCalledWith('/zoom/meetings/42', requestBody);
    expect(result).toBe(mockResponse);
  });

  // TC_ZOOM_API_17
  it('TC_ZOOM_API_17: Partial update body (chỉ title)', async () => {
    const requestBody: UpdateZoomMeetingRequest = { title: 'x' };
    const mockResponse = { message: 'ok', result: { id: 42, title: 'x' } };
    mockAxios.put.mockResolvedValue(mockResponse);

    await updateZoomMeeting(42, requestBody);

    const callArgs = mockAxios.put.mock.calls[0] as [string, UpdateZoomMeetingRequest];
    expect(Object.keys(callArgs[1])).toEqual(['title']);
  });

  // TC_ZOOM_API_18
  it('TC_ZOOM_API_18: Update status → enum value đúng', async () => {
    const requestBody: UpdateZoomMeetingRequest = { status: 'ENDED' };
    const mockResponse = { message: 'ok', result: { id: 42, status: 'ENDED' } };
    mockAxios.put.mockResolvedValue(mockResponse);

    await updateZoomMeeting(42, requestBody);

    const callArgs = mockAxios.put.mock.calls[0] as [string, UpdateZoomMeetingRequest];
    expect(callArgs[1].status).toBe('ENDED');
  });

  // TC_ZOOM_API_19
  it('TC_ZOOM_API_19: 422 (vượt Zoom limit) propagate', async () => {
    const error = new Error('Unprocessable Entity');
    (error as any).response = { status: 422 };
    mockAxios.put.mockRejectedValue(error);

    const requestBody: UpdateZoomMeetingRequest = { durationMinutes: 120 };

    await expect(updateZoomMeeting(42, requestBody)).rejects.toEqual(error);
  });
});

// ==================== NHÓM E — deleteZoomMeeting ====================

describe('Nhóm E — deleteZoomMeeting', () => {
  // TC_ZOOM_API_20
  it('TC_ZOOM_API_20: DELETE /zoom/meetings/:id', async () => {
    const mockResponse = { message: 'ok', result: { message: 'Deleted' } };
    mockAxios.delete.mockResolvedValue(mockResponse);

    const result = await deleteZoomMeeting(42);

    expect(mockAxios.delete).toHaveBeenCalledWith('/zoom/meetings/42');
    expect(result).toBe(mockResponse);
  });

  // TC_ZOOM_API_21
  it('TC_ZOOM_API_21: 404 propagate', async () => {
    const error = new Error('Not Found');
    (error as any).response = { status: 404 };
    mockAxios.delete.mockRejectedValue(error);

    await expect(deleteZoomMeeting(999)).rejects.toEqual(error);
  });

  // TC_ZOOM_API_22
  it('TC_ZOOM_API_22: 403 (không phải chủ meeting) propagate', async () => {
    const error = new Error('Forbidden');
    (error as any).response = { status: 403 };
    mockAxios.delete.mockRejectedValue(error);

    await expect(deleteZoomMeeting(42)).rejects.toEqual(error);
  });
});

// ==================== NHÓM F — ERROR & BEHAVIORAL CONTRACT ====================

describe('Nhóm F — ERROR & BEHAVIORAL CONTRACT', () => {
  // TC_ZOOM_API_23
  it('TC_ZOOM_API_23: 401 Unauthorized propagate chung', async () => {
    const error = new Error('Unauthorized');
    (error as any).response = { status: 401 };
    mockAxios.get.mockRejectedValue(error);

    await expect(getZoomMeetings()).rejects.toEqual(error);
  });

  // TC_ZOOM_API_24
  it('TC_ZOOM_API_24: Network error propagate', async () => {
    const error = new Error('Network Error');
    mockAxios.get.mockRejectedValue(error);

    await expect(getZoomMeetings()).rejects.toEqual(error);
  });

  // TC_ZOOM_API_25
  it('TC_ZOOM_API_25: Wrapper KHÔNG retry — gọi 1 lần mock', async () => {
    const mockResponse = { message: 'ok', result: [] };
    mockAxios.get.mockResolvedValue(mockResponse);

    await getZoomMeetings();

    expect(mockAxios.get).toHaveBeenCalledTimes(1);
  });
});
