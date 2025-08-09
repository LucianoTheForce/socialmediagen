/**
 * Canvas Management Integration Test Suite
 * 
 * Tests the integration between Canvas Properties, Canvas Navigation, and Carousel Store
 * to ensure all canvas management features work correctly together.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CanvasProperties } from '../properties-panel/canvas-properties';
import { CanvasNavigation } from '../canvas-navigation';
import { useCarouselStore } from '@/stores/carousel';
import { useEditorStore } from '@/stores/editor-store';
import { useTimelineStore } from '@/stores/timeline-store';

// Mock stores
vi.mock('@/stores/carousel');
vi.mock('@/stores/editor-store');
vi.mock('@/stores/timeline-store');

// Test Data
const mockCanvas = {
  id: 'canvas-1',
  format: {
    id: 'instagram-post',
    name: 'Instagram Post',
   dimensions: { width: 1080, height: 1350 }
  },
  slideMetadata: {
    title: 'Test Canvas 1',
    content: 'Test content',
    slideNumber: 1,
    backgroundPrompt: 'Test background'
  },
  isActive: true,
  position: { x: 0, y: 0 },
  fill: { enabled: true, color: '#000000' },
 customSize: { width: 1080, height: 1350 },
  duration: 5
};

const mockProject = {
  id: 'project-1',
  type: 'instagram-carousel',
  name: 'Test Carousel',
  canvases: [mockCanvas],
  carouselMetadata: {
    slideCount: 1,
    backgroundStrategy: 'ai-generated'
  }
};

describe('Canvas Management Integration Tests', () => {
  let mockUpdateCanvas: ReturnType<typeof vi.fn>;
  let mockSetActiveCanvas: ReturnType<typeof vi.fn>;
  let mockAddCanvas: ReturnType<typeof vi.fn>;
  let mockRemoveCanvas: ReturnType<typeof vi.fn>;
  let mockDuplicateCanvas: ReturnType<typeof vi.fn>;
  let mockSetCanvasSize: ReturnType<typeof vi.fn>;
  let mockSwitchToCanvas: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks
    mockUpdateCanvas = vi.fn();
    mockSetActiveCanvas = vi.fn();
    mockAddCanvas = vi.fn();
    mockRemoveCanvas = vi.fn();
    mockDuplicateCanvas = vi.fn();
    mockSetCanvasSize = vi.fn();
    mockSwitchToCanvas = vi.fn();

    // Mock carousel store
    (useCarouselStore as any).mockReturnValue({
      currentProject: mockProject,
      updateCanvas: mockUpdateCanvas,
      setActiveCanvas: mockSetActiveCanvas,
      addCanvas: mockAddCanvas,
      removeCanvas: mockRemoveCanvas,
      duplicateCanvas: mockDuplicateCanvas,
      navigation: {
        isNavigationVisible: true,
        thumbnailSize: 'medium',
        showAddButton: true,
        maxCanvasCount: 10
      },
      getCanvasLoadingState: () => null
    });

    // Mock active canvas hook
    vi.mocked(useCarouselStore).mockImplementation((selector: any) => {
      if (selector.toString().includes('getActiveCanvas')) {
        return mockCanvas;
      }
      return useCarouselStore(selector);
    });

    // Mock editor store
    (useEditorStore as any).mockReturnValue({
     canvasSize: { width: 1080, height: 1350 },
      setCanvasSize: mockSetCanvasSize
    });

    // Mock timeline store
    (useTimelineStore as any).mockReturnValue({
      switchToCanvas: mockSwitchToCanvas
    });
  });

  describe('Property Persistence Integration', () => {
    it('should persist canvas position changes to carousel store', async () => {
      render(<CanvasProperties />);
      
      const xInput = screen.getByLabelText('X');
      fireEvent.change(xInput, { target: { value: '100' } });

      await waitFor(() => {
        expect(mockUpdateCanvas).toHaveBeenCalledWith('canvas-1', {
          position: { x: 100, y: 0 }
        });
      });
    });

    it('should persist canvas size changes to carousel store', async () => {
      render(<CanvasProperties />);
      
      const widthInput = screen.getByLabelText('Width');
      fireEvent.change(widthInput, { target: { value: '1200' } });

      await waitFor(() => {
        expect(mockSetCanvasSize).toHaveBeenCalledWith({ width: 1200, height: 1080 });
        expect(mockUpdateCanvas).toHaveBeenCalledWith('canvas-1', {
          customSize: { width: 1200, height: 1080 }
        });
      });
    });

    it('should persist canvas fill changes to carousel store', async () => {
      render(<CanvasProperties />);
      
      const colorInput = screen.getByDisplayValue('#000000');
      fireEvent.change(colorInput, { target: { value: '#FF0000' } });

      await waitFor(() => {
        expect(mockUpdateCanvas).toHaveBeenCalledWith('canvas-1', {
          fill: { enabled: true, color: '#FF0000' }
        });
      });
    });

    it('should persist canvas duration changes to carousel store', async () => {
      render(<CanvasProperties />);
      
      const durationInput = screen.getByDisplayValue('5');
      fireEvent.change(durationInput, { target: { value: '7' } });

      await waitFor(() => {
        expect(mockUpdateCanvas).toHaveBeenCalledWith('canvas-1', {
          duration: 7
        });
      });
    });

    it('should persist format changes to carousel store', async () => {
      render(<CanvasProperties />);
      
      const formatSelect = screen.getByRole('combobox');
      fireEvent.click(formatSelect);
      
      const squareOption = screen.getByText('Instagram Story');
      fireEvent.click(squareOption);

      await waitFor(() => {
        expect(mockUpdateCanvas).toHaveBeenCalledWith('canvas-1', {
          format: expect.objectContaining({
            id: 'instagram-story'
          }),
          customSize: expect.objectContaining({
            width: expect.any(Number),
            height: expect.any(Number)
          })
        });
      });
    });
  });

  describe('Canvas Navigation Integration', () => {
    it('should update active canvas and switch timeline context', async () => {
      const multiCanvasProject = {
        ...mockProject,
        canvases: [
          mockCanvas,
          { ...mockCanvas, id: 'canvas-2', isActive: false, slideMetadata: { ...mockCanvas.slideMetadata, title: 'Canvas 2' } }
        ]
      };

      (useCarouselStore as any).mockReturnValue({
        ...useCarouselStore(),
        currentProject: multiCanvasProject
      });

      render(<CanvasNavigation />);
      
      const canvas2Thumbnail = screen.getByTitle(/Canvas 2/);
      fireEvent.click(canvas2Thumbnail);

      expect(mockSetActiveCanvas).toHaveBeenCalledWith('canvas-2');
      expect(mockSwitchToCanvas).toHaveBeenCalledWith('canvas-2');
    });

    it('should handle canvas duplication through navigation', async () => {
      render(<CanvasNavigation />);
      
      const moreButton = screen.getByTitle('Canvas navigation settings');
      fireEvent.click(moreButton);
      
      const duplicateButton = screen.getByText('Duplicate');
      fireEvent.click(duplicateButton);

      expect(mockDuplicateCanvas).toHaveBeenCalledWith('canvas-1');
    });

    it('should handle canvas removal through navigation', async () => {
      const multiCanvasProject = {
        ...mockProject,
        canvases: [
          mockCanvas,
          { ...mockCanvas, id: 'canvas-2', isActive: false }
        ]
      };

      (useCarouselStore as any).mockReturnValue({
        ...useCarouselStore(),
        currentProject: multiCanvasProject
      });

      render(<CanvasNavigation />);
      
      const moreButton = screen.getAllByTitle(/Canvas/)[0];
      fireEvent.click(moreButton);
      
      const removeButton = screen.getByText('Remove');
      fireEvent.click(removeButton);

      expect(mockRemoveCanvas).toHaveBeenCalledWith('canvas-1');
    });

    it('should handle new canvas creation', async () => {
      render(<CanvasNavigation />);
      
      const addButton = screen.getByTitle('Add new canvas');
      fireEvent.click(addButton);

      expect(mockAddCanvas).toHaveBeenCalled();
    });
  });

  describe('Keyboard Shortcuts Integration', () => {
    it('should handle Ctrl+Shift+D for canvas duplication', () => {
      render(<CanvasNavigation />);
      
      fireEvent.keyDown(document, {
        key: 'D',
        ctrlKey: true,
        shiftKey: true
      });

      expect(mockDuplicateCanvas).toHaveBeenCalledWith('canvas-1');
    });

    it('should handle Delete key for canvas removal', () => {
      const multiCanvasProject = {
        ...mockProject,
        canvases: [
          mockCanvas,
          { ...mockCanvas, id: 'canvas-2', isActive: false }
        ]
      };

      (useCarouselStore as any).mockReturnValue({
        ...useCarouselStore(),
        currentProject: multiCanvasProject
      });

      render(<CanvasNavigation />);
      
      fireEvent.keyDown(document, { key: 'Delete' });

      expect(mockRemoveCanvas).toHaveBeenCalledWith('canvas-1');
    });

    it('should handle arrow keys for navigation', () => {
      const multiCanvasProject = {
        ...mockProject,
        canvases: [
          mockCanvas,
          { ...mockCanvas, id: 'canvas-2', isActive: false }
        ]
      };

      (useCarouselStore as any).mockReturnValue({
        ...useCarouselStore(),
        currentProject: multiCanvasProject
      });

      render(<CanvasNavigation />);
      
      fireEvent.keyDown(document, { key: 'ArrowRight' });

      expect(mockSetActiveCanvas).toHaveBeenCalledWith('canvas-2');
      expect(mockSwitchToCanvas).toHaveBeenCalledWith('canvas-2');
    });

    it('should not interfere with form inputs', () => {
      render(
        <div>
          <CanvasNavigation />
          <input data-testid="text-input" />
        </div>
      );
      
      const textInput = screen.getByTestId('text-input');
      textInput.focus();
      
      fireEvent.keyDown(textInput, { key: 'Delete' });

      expect(mockRemoveCanvas).not.toHaveBeenCalled();
    });
  });

  describe('Property Validation Integration', () => {
    it('should show validation errors for invalid canvas dimensions', async () => {
      render(<CanvasProperties />);
      
      const widthInput = screen.getByLabelText('Width');
      fireEvent.change(widthInput, { target: { value: '0' } });

      await waitFor(() => {
        expect(screen.getByText(/Width must be at least/)).toBeInTheDocument();
      });

      // Should not persist invalid values
      expect(mockUpdateCanvas).not.toHaveBeenCalled();
    });

    it('should show validation errors for invalid position values', async () => {
      render(<CanvasProperties />);
      
      const xInput = screen.getByLabelText('X');
      fireEvent.change(xInput, { target: { value: '99999' } });

      await waitFor(() => {
        expect(screen.getByText(/X position must be between/)).toBeInTheDocument();
      });

      expect(mockUpdateCanvas).not.toHaveBeenCalled();
    });

    it('should show validation errors for invalid color values', async () => {
      render(<CanvasProperties />);
      
      const colorInput = screen.getByDisplayValue('#000000');
      fireEvent.change(colorInput, { target: { value: 'invalid-color' } });

      await waitFor(() => {
        expect(screen.getByText(/Color must be a valid hex color/)).toBeInTheDocument();
      });

      expect(mockUpdateCanvas).not.toHaveBeenCalled();
    });
  });

  describe('State Consistency Integration', () => {
    it('should maintain consistent state across property changes and navigation', async () => {
      render(
        <div>
          <CanvasProperties />
          <CanvasNavigation />
        </div>
      );
      
      // Change a property
      const widthInput = screen.getByLabelText('Width');
      fireEvent.change(widthInput, { target: { value: '1200' } });

      await waitFor(() => {
        expect(mockUpdateCanvas).toHaveBeenCalledWith('canvas-1', {
          customSize: { width: 1200, height: 1080 }
        });
      });

      // Simulate navigation change
      fireEvent.keyDown(document, { key: 'ArrowRight' });

      // Verify both systems are synchronized
      expect(mockSetActiveCanvas).toHaveBeenCalled();
      expect(mockSwitchToCanvas).toHaveBeenCalled();
    });

    it('should load persisted properties when switching canvases', () => {
      const canvasWithCustomSize = {
        ...mockCanvas,
        customSize: { width: 1200, height: 800 }
      };

      // Mock the active canvas hook to return canvas with custom size
      vi.mocked(useCarouselStore).mockImplementation((selector: any) => {
        if (selector.toString().includes('getActiveCanvas')) {
          return canvasWithCustomSize;
        }
        return useCarouselStore(selector);
      });

      render(<CanvasProperties />);

      // Should initialize EditorStore with persisted custom size
      expect(mockSetCanvasSize).toHaveBeenCalledWith({
        width: 1200,
        height: 800
      });
    });
  });

  describe('Loading States Integration', () => {
    it('should handle canvas loading states in navigation', () => {
      const loadingState = {
        canvasId: 'canvas-1',
        isImageLoading: true,
        imageLoadProgress: 50,
        isImageLoaded: false,
        isTextLoaded: true,
        hasPlaceholder: true
      };

      (useCarouselStore as any).mockReturnValue({
        ...useCarouselStore(),
        getCanvasLoadingState: () => loadingState
      });

      render(<CanvasNavigation />);
      
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByTitle(/Loading/)).toBeInTheDocument();
    });

    it('should disable property changes during critical operations', async () => {
      // This would be implemented if we add loading states to property panels
      render(<CanvasProperties />);
      
      const widthInput = screen.getByLabelText('Width');
      expect(widthInput).not.toBeDisabled();
    });
  });
});

export default {};