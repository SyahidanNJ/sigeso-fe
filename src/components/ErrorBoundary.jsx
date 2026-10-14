import React from 'react';
import { postClientError } from '../lib/api';

export default class ErrorBoundary extends React.Component {
  constructor(p) {
    super(p);
    this.state = {};
  }
  static getDerivedStateFromError(e) {
    return { error: e };
  }
  componentDidCatch(e) {
    postClientError(e);
  }
  render() {
    if (this.state.error) return <p>Gagal memuat halaman. Muat ulang browser.</p>;
    return this.props.children;
  }
}
