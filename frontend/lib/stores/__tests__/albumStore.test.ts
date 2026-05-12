/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';

import { useAlbumStore } from '../albumStore';
import { api } from '../../services/http';

jest.mock('../../services/http', () => ({
  api: { get: jest.fn() },
}));

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => {
  useAlbumStore.getState().clear();
  mockApi.get.mockReset();
});

describe('albumStore', () => {
  it('fetches and stores the album list', async () => {
    mockApi.get.mockResolvedValue({
      data: { results: [{ id: 1, name: 'Mundial 26', slug: 'mundial-26', edition_year: 2026, total_stickers: 670, cover_image_url: '' }] },
    });

    await useAlbumStore.getState().fetchAlbums();

    const s = useAlbumStore.getState();
    expect(s.albums).toHaveLength(1);
    expect(s.albums[0].slug).toBe('mundial-26');
    expect(s.albumsLoaded).toBe(true);
  });

  it('fetches a single album detail by slug', async () => {
    mockApi.get.mockResolvedValue({
      data: { id: 1, name: 'Mundial 26', slug: 'mundial-26', edition_year: 2026, total_stickers: 670, cover_image_url: '' },
    });

    await useAlbumStore.getState().fetchAlbum('mundial-26');

    expect(useAlbumStore.getState().currentAlbum?.slug).toBe('mundial-26');
    expect(mockApi.get).toHaveBeenCalledWith('albums/mundial-26/');
  });

  it('forwards filters when fetching stickers', async () => {
    mockApi.get.mockResolvedValue({ data: { results: [] } });

    await useAlbumStore.getState().fetchStickers('mundial-26', { team: 'Colombia', special: 'true' });

    expect(mockApi.get).toHaveBeenCalledWith('albums/mundial-26/stickers/', {
      params: { team: 'Colombia', special: 'true' },
    });
  });

  it('skips the search call when the query is shorter than 2 characters', async () => {
    const result = await useAlbumStore.getState().searchStickers('mundial-26', 'a');
    expect(result).toEqual([]);
    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it('queries the album search endpoint and returns its results', async () => {
    mockApi.get.mockResolvedValue({ data: { results: [{ id: 1, number: '10', name: 'Messi' }] } });
    const result = await useAlbumStore.getState().searchStickers('mundial-26', 'mes');
    expect(mockApi.get).toHaveBeenCalledWith('albums/mundial-26/search/', { params: { q: 'mes' } });
    expect(result).toHaveLength(1);
  });

  it('records an error message when fetchAlbums fails', async () => {
    mockApi.get.mockRejectedValue(new Error('boom'));

    await expect(useAlbumStore.getState().fetchAlbums()).rejects.toThrow('boom');
    expect(useAlbumStore.getState().error).toBe('fetch_albums_failed');
  });
});
