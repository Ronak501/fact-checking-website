"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    AlertTriangle,
    CheckCircle,
    XCircle,
    Download,
    Eye,
    Clock,
    Shield,
    Zap,
    TrendingUp,
    Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VideoAnalysisResults {
    aiGenerated: {
        confidence: number;
        techniques: string[];
        explanation: string;
        indicators: {
            facial_inconsistencies: number;
            temporal_artifacts: number;
            lighting_anomalies: number;
            compression_artifacts: number;
        };
    };
    manipulation: {
        confidence: number;
        anomalies: Array<{
            timestamp: number;
            duration: number;
            type: string;
            confidence: number;
            description: string;
        }>;
        explanation: string;
        indicators: {
            frame_cuts: number;
            object_insertion: number;
            background_changes: number;
            audio_sync_issues: number;
        };
    };
    authenticity: {
        confidence: number;
        sources: Array<{
            url?: string;
            similarity: number;
            source: string;
            verified: boolean;
        }>;
        metadata: {
            creation_date?: string;
            device_info?: string;
            location?: string;
            compression_history: string[];
        };
        explanation: string;
    };
    overall: {
        credibilityScore: number;
        recommendation: string;
        summary: string;
    };
}

interface VideoAnalysisDisplayProps {
    results: VideoAnalysisResults;
    isLoading?: boolean;
    onDownloadReport?: () => void;
    className?: string;
}

export function VideoAnalysisDisplay({
    results,
    isLoading = false,
    onDownloadReport,
    className
}: VideoAnalysisDisplayProps) {
    const [activeTab, setActiveTab] = useState('overview');

    // Get credibility color and icon
    const getCredibilityStatus = (score: number) => {
        if (score >= 80) return { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle, label: 'High Credibility' };
        if (score >= 60) return { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: AlertTriangle, label: 'Moderate Credibility' };
        if (score >= 40) return { color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertTriangle, label: 'Low Credibility' };
        return { color: 'text-red-600', bg: 'bg-red-50', icon: XCircle, label: 'Very Low Credibility' };
    };

    const credibilityStatus = getCredibilityStatus(results.overall.credibilityScore);
    const CredibilityIcon = credibilityStatus.icon;

    if (isLoading) {
        return (
            <Card className={cn("w-full", className)}>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            <span className="text-sm text-muted-foreground">Analyzing video...</span>
                        </div>
                        <Progress value={65} className="w-full" />
                        <p className="text-xs text-muted-foreground">
                            Running AI detection, manipulation analysis, and authenticity verification...
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={cn("w-full space-y-6", className)}>
            {/* Overall Results Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className={cn("p-2 rounded-full", credibilityStatus.bg)}>
                                <CredibilityIcon className={cn("h-5 w-5", credibilityStatus.color)} />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Video Analysis Results</CardTitle>
                                <p className="text-sm text-muted-foreground">{credibilityStatus.label}</p>
                            </div>
                        </div>
                        {onDownloadReport && (
                            <Button variant="outline" size="sm" onClick={onDownloadReport}>
                                <Download className="h-4 w-4 mr-2" />
                                Download Report
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Credibility Score */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Overall Credibility Score</span>
                                <span className={cn("text-lg font-bold", credibilityStatus.color)}>
                                    {results.overall.credibilityScore}%
                                </span>
                            </div>
                            <Progress
                                value={results.overall.credibilityScore}
                                className="h-2"
                            />
                        </div>

                        {/* Recommendation */}
                        <div className={cn("p-3 rounded-lg border", credibilityStatus.bg)}>
                            <p className="text-sm font-medium mb-1">Recommendation</p>
                            <p className="text-sm">{results.overall.recommendation}</p>
                        </div>

                        {/* Summary */}
                        <div>
                            <p className="text-sm text-muted-foreground">{results.overall.summary}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Detailed Analysis Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="ai-detection">AI Detection</TabsTrigger>
                    <TabsTrigger value="manipulation">Manipulation</TabsTrigger>
                    <TabsTrigger value="authenticity">Authenticity</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* AI Detection Summary */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center space-x-2">
                                    <Zap className="h-4 w-4 text-blue-500" />
                                    <CardTitle className="text-sm">AI Detection</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Confidence</span>
                                        <Badge variant={results.aiGenerated.confidence > 70 ? "destructive" : results.aiGenerated.confidence > 40 ? "secondary" : "outline"}>
                                            {results.aiGenerated.confidence}%
                                        </Badge>
                                    </div>
                                    <Progress value={results.aiGenerated.confidence} className="h-1" />
                                    <p className="text-xs text-muted-foreground">
                                        {results.aiGenerated.techniques.length} technique(s) detected
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Manipulation Summary */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center space-x-2">
                                    <Eye className="h-4 w-4 text-orange-500" />
                                    <CardTitle className="text-sm">Manipulation</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Confidence</span>
                                        <Badge variant={results.manipulation.confidence > 70 ? "destructive" : results.manipulation.confidence > 40 ? "secondary" : "outline"}>
                                            {results.manipulation.confidence}%
                                        </Badge>
                                    </div>
                                    <Progress value={results.manipulation.confidence} className="h-1" />
                                    <p className="text-xs text-muted-foreground">
                                        {results.manipulation.anomalies.length} anomal(ies) found
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Authenticity Summary */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center space-x-2">
                                    <Shield className="h-4 w-4 text-green-500" />
                                    <CardTitle className="text-sm">Authenticity</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Confidence</span>
                                        <Badge variant={results.authenticity.confidence > 70 ? "default" : results.authenticity.confidence > 40 ? "secondary" : "destructive"}>
                                            {results.authenticity.confidence}%
                                        </Badge>
                                    </div>
                                    <Progress value={results.authenticity.confidence} className="h-1" />
                                    <p className="text-xs text-muted-foreground">
                                        {results.authenticity.sources.length} source(s) analyzed
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* AI Detection Tab */}
                <TabsContent value="ai-detection" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Zap className="h-5 w-5 text-blue-500" />
                                <span>AI Generation Analysis</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Confidence Score */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">AI Generation Confidence</span>
                                    <Badge variant={results.aiGenerated.confidence > 70 ? "destructive" : "outline"} className="text-sm">
                                        {results.aiGenerated.confidence}%
                                    </Badge>
                                </div>
                                <Progress value={results.aiGenerated.confidence} />
                            </div>

                            {/* Detected Techniques */}
                            {results.aiGenerated.techniques.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Detected Techniques</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {results.aiGenerated.techniques.map((technique, index) => (
                                            <Badge key={index} variant="secondary">
                                                {technique}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Indicators */}
                            <div className="space-y-3">
                                <h4 className="font-medium text-sm">Detection Indicators</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span>Facial Inconsistencies</span>
                                            <span>{Math.round(results.aiGenerated.indicators.facial_inconsistencies)}%</span>
                                        </div>
                                        <Progress value={results.aiGenerated.indicators.facial_inconsistencies} className="h-1" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span>Temporal Artifacts</span>
                                            <span>{Math.round(results.aiGenerated.indicators.temporal_artifacts)}%</span>
                                        </div>
                                        <Progress value={results.aiGenerated.indicators.temporal_artifacts} className="h-1" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span>Lighting Anomalies</span>
                                            <span>{Math.round(results.aiGenerated.indicators.lighting_anomalies)}%</span>
                                        </div>
                                        <Progress value={results.aiGenerated.indicators.lighting_anomalies} className="h-1" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span>Compression Artifacts</span>
                                            <span>{Math.round(results.aiGenerated.indicators.compression_artifacts)}%</span>
                                        </div>
                                        <Progress value={results.aiGenerated.indicators.compression_artifacts} className="h-1" />
                                    </div>
                                </div>
                            </div>

                            {/* Explanation */}
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">Analysis Explanation</h4>
                                <div className="bg-muted p-3 rounded-lg">
                                    <p className="text-sm whitespace-pre-wrap">{results.aiGenerated.explanation}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Manipulation Tab */}
                <TabsContent value="manipulation" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Eye className="h-5 w-5 text-orange-500" />
                                <span>Manipulation Detection</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Confidence Score */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Manipulation Confidence</span>
                                    <Badge variant={results.manipulation.confidence > 70 ? "destructive" : "outline"} className="text-sm">
                                        {results.manipulation.confidence}%
                                    </Badge>
                                </div>
                                <Progress value={results.manipulation.confidence} />
                            </div>

                            {/* Timeline Anomalies */}
                            {results.manipulation.anomalies.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="font-medium text-sm">Timeline Anomalies</h4>
                                    <div className="space-y-2">
                                        {results.manipulation.anomalies.map((anomaly, index) => (
                                            <div key={index} className="border rounded-lg p-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center space-x-2">
                                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm font-medium">
                                                            {Math.round(anomaly.timestamp)}s - {Math.round(anomaly.timestamp + anomaly.duration)}s
                                                        </span>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                        {anomaly.confidence}% confidence
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{anomaly.description}</p>
                                                <Badge variant="secondary" className="text-xs mt-2">
                                                    {anomaly.type.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Manipulation Indicators */}
                            <div className="space-y-3">
                                <h4 className="font-medium text-sm">Manipulation Indicators</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span>Frame Cuts</span>
                                            <span>{results.manipulation.indicators.frame_cuts}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span>Object Insertion</span>
                                            <span>{results.manipulation.indicators.object_insertion}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span>Background Changes</span>
                                            <span>{results.manipulation.indicators.background_changes}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span>Audio Sync Issues</span>
                                            <span>{results.manipulation.indicators.audio_sync_issues}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Explanation */}
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">Analysis Explanation</h4>
                                <div className="bg-muted p-3 rounded-lg">
                                    <p className="text-sm whitespace-pre-wrap">{results.manipulation.explanation}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Authenticity Tab */}
                <TabsContent value="authenticity" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Shield className="h-5 w-5 text-green-500" />
                                <span>Authenticity Verification</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Confidence Score */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Authenticity Confidence</span>
                                    <Badge variant={results.authenticity.confidence > 70 ? "default" : "destructive"} className="text-sm">
                                        {results.authenticity.confidence}%
                                    </Badge>
                                </div>
                                <Progress value={results.authenticity.confidence} />
                            </div>

                            {/* Sources */}
                            {results.authenticity.sources.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="font-medium text-sm">Source Analysis</h4>
                                    <div className="space-y-2">
                                        {results.authenticity.sources.map((source, index) => (
                                            <div key={index} className="border rounded-lg p-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium">{source.source}</span>
                                                    <div className="flex items-center space-x-2">
                                                        <Badge variant={source.verified ? "default" : "secondary"} className="text-xs">
                                                            {source.verified ? "Verified" : "Unverified"}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {source.similarity}% match
                                                        </Badge>
                                                    </div>
                                                </div>
                                                {source.url && (
                                                    <p className="text-xs text-muted-foreground truncate">{source.url}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Metadata */}
                            <div className="space-y-3">
                                <h4 className="font-medium text-sm">Metadata Analysis</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {results.authenticity.metadata.creation_date && (
                                        <div>
                                            <span className="text-xs text-muted-foreground">Creation Date</span>
                                            <p className="text-sm">{results.authenticity.metadata.creation_date}</p>
                                        </div>
                                    )}
                                    {results.authenticity.metadata.device_info && (
                                        <div>
                                            <span className="text-xs text-muted-foreground">Device Info</span>
                                            <p className="text-sm">{results.authenticity.metadata.device_info}</p>
                                        </div>
                                    )}
                                    {results.authenticity.metadata.location && (
                                        <div>
                                            <span className="text-xs text-muted-foreground">Location</span>
                                            <p className="text-sm">{results.authenticity.metadata.location}</p>
                                        </div>
                                    )}
                                    {results.authenticity.metadata.compression_history.length > 0 && (
                                        <div>
                                            <span className="text-xs text-muted-foreground">Compression History</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {results.authenticity.metadata.compression_history.map((format, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                        {format}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Explanation */}
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">Analysis Explanation</h4>
                                <div className="bg-muted p-3 rounded-lg">
                                    <p className="text-sm whitespace-pre-wrap">{results.authenticity.explanation}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}