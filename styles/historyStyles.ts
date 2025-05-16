import { StyleSheet } from 'react-native';
import { palette } from './colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.gray100,
  },
  farmDropdownContainer: {
    padding: 16,
    backgroundColor: palette.white,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
  },
  backButtonText: {
    marginLeft: 8,
    color: '#1B4D3E',
    fontSize: 16,
    fontWeight: '500',
  },
  headerContainer: {
    backgroundColor: palette.primary,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
    marginRight: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  refreshButtonEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  refreshText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 16,
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexWrap: 'wrap',
  },
  breadcrumbLink: {
    marginRight: 4,
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#1B4D3E',
    fontWeight: '500',
  },
  breadcrumbSeparator: {
    fontSize: 14,
    color: '#999',
    marginRight: 4,
  },
  breadcrumbActiveText: {
    fontSize: 14,
    color: palette.accent,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: palette.accent,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: palette.textLight,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: palette.textMid,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});