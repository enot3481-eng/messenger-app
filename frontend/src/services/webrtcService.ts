import React, { useRef, useEffect, useState } from 'react';

export interface WebRTCServiceInstance {
  initLocalStream: (video: boolean, audio: boolean) => Promise<MediaStream>;
  createPeerConnection: (peerId: string) => RTCPeerConnection;
  createOffer: (peerConnection: RTCPeerConnection) => Promise<RTCSessionDescriptionInit>;
  createAnswer: (peerConnection: RTCPeerConnection, offer: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit>;
  handleAnswer: (peerConnection: RTCPeerConnection, answer: RTCSessionDescriptionInit) => Promise<void>;
  addICECandidate: (peerConnection: RTCPeerConnection, candidate: RTCIceCandidateInit) => Promise<void>;
  toggleAudio: (stream: MediaStream, enabled: boolean) => void;
  toggleVideo: (stream: MediaStream, enabled: boolean) => void;
  getConnectionStats: (peerConnection: RTCPeerConnection) => Promise<any>;
  closePeerConnection: (peerConnection: RTCPeerConnection) => void;
}

class WebRTCServiceImpl implements WebRTCServiceInstance {
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private peerConnections = new Map<string, RTCPeerConnection>();

  async initLocalStream(video: boolean = true, audio: boolean = true): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        audio: audio
      });
      return this.localStream;
    } catch (error) {
      console.error('Error getting local stream:', error);
      throw error;
    }
  }

  createPeerConnection(peerId: string): RTCPeerConnection {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    });

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    peerConnection.ontrack = (event) => {
      console.log('Remote track added:', event.track);
      this.remoteStream = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Отправить кандидата другой стороне через WebSocket
        console.log('ICE candidate:', event.candidate);
      }
    };

    this.peerConnections.set(peerId, peerConnection);
    return peerConnection;
  }

  async createOffer(peerConnection: RTCPeerConnection): Promise<RTCSessionDescriptionInit> {
    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    await peerConnection.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(peerConnection: RTCPeerConnection, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(peerConnection: RTCPeerConnection, answer: RTCSessionDescriptionInit): Promise<void> {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async addICECandidate(peerConnection: RTCPeerConnection, candidate: RTCIceCandidateInit): Promise<void> {
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  toggleAudio(stream: MediaStream, enabled: boolean): void {
    stream.getAudioTracks().forEach(track => {
      track.enabled = enabled;
    });
  }

  toggleVideo(stream: MediaStream, enabled: boolean): void {
    stream.getVideoTracks().forEach(track => {
      track.enabled = enabled;
    });
  }

  closePeerConnection(peerConnection: RTCPeerConnection): void {
    peerConnection.close();
  }

  async getConnectionStats(peerConnection: RTCPeerConnection): Promise<any> {
    const stats = await peerConnection.getStats();
    const result: any = {};
    stats.forEach(report => {
      if (report.type === 'inbound-rtp') {
        result.bytesReceived = report.bytesReceived;
        result.packetsLost = report.packetsLost;
      }
      if (report.type === 'outbound-rtp') {
        result.bytesSent = report.bytesSent;
      }
    });
    return result;
  }
}

export const webrtcService = new WebRTCServiceImpl();
