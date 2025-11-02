'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import RatingStars from '@/components/RatingStars';
import ReviewForm from '@/components/ReviewForm';

interface Review {
  id: number;
  request_id: number;
  reviewer_id: number;
  reviewed_id: number;
  rating: number;
  comment: string;
  review_type: 'client_to_provider' | 'provider_to_client';
  created_at: string;
  updated_at: string;
  reviewer_name: string;
  reviewed_name: string;
  service_title: string;
}

interface CompletedService {
  id: number;
  title: string;
  client_id: number;
  provider_id: number;
  provider_name: string;
  client_name: string;
  completed_at: string;
  can_review_provider: boolean;
  can_review_client: boolean;
  provider_review?: Review;
  client_review?: Review;
}

export default function ReviewsPage() {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [completedServices, setCompletedServices] = useState<CompletedService[]>([]);
  const [activeTab, setActiveTab] = useState<'received' | 'given' | 'pending'>('received');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedService, setSelectedService] = useState<CompletedService | null>(null);
  const [reviewType, setReviewType] = useState<'client_to_provider' | 'provider_to_client'>('client_to_provider');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchReviews();
      fetchCompletedServices();
    }
  }, [session, activeTab]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?user_id=${session?.user?.id}&type=${activeTab}`);
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
    }
  };

  const fetchCompletedServices = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/requests?status=completed&user_id=${session?.user?.id}`);
      const data = await response.json();

      // Processar serviços para verificar quais podem ser avaliados
      const servicesWithReviews = await Promise.all(
        data.requests.map(async (service: any) => {
          const reviewsResponse = await fetch(`/api/reviews?request_id=${service.id}`);
          const reviewsData = await reviewsResponse.json();
          const serviceReviews = reviewsData.reviews || [];

          return {
            ...service,
            can_review_provider: session?.user?.id === service.client_id &&
              !serviceReviews.some((r: Review) => r.review_type === 'client_to_provider'),
            can_review_client: session?.user?.id === service.provider_id &&
              !serviceReviews.some((r: Review) => r.review_type === 'provider_to_client'),
            provider_review: serviceReviews.find((r: Review) => r.review_type === 'client_to_provider'),
            client_review: serviceReviews.find((r: Review) => r.review_type === 'provider_to_client')
          };
        })
      );

      setCompletedServices(servicesWithReviews);
    } catch (error) {
      console.error('Erro ao buscar serviços concluídos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewSubmit = async (reviewData: { rating: number; comment: string }) => {
    if (!selectedService) return;

    try {
      setIsSubmitting(true);

      const reviewPayload = {
        request_id: selectedService.id,
        reviewed_id: reviewType === 'client_to_provider' ? selectedService.provider_id : selectedService.client_id,
        rating: reviewData.rating,
        comment: reviewData.comment,
        review_type: reviewType
      };

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewPayload),
      });

      if (response.ok) {
        setShowReviewForm(false);
        setSelectedService(null);
        fetchReviews();
        fetchCompletedServices();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erro ao enviar avaliação');
      }
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      alert('Erro ao enviar avaliação');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReviewForm = (service: CompletedService, type: 'client_to_provider' | 'provider_to_client') => {
    setSelectedService(service);
    setReviewType(type);
    setShowReviewForm(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Restrito</h1>
          <p className="text-gray-600">Faça login para ver suas avaliações</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Avaliações</h1>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'received'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Recebidas
          </button>
          <button
            onClick={() => setActiveTab('given')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'given'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Enviadas
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'pending'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Pendentes
          </button>
        </div>

        {/* Content */}
        {activeTab === 'pending' ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Serviços Concluídos - Aguardando Avaliação
            </h2>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando...</p>
              </div>
            ) : completedServices.filter(s => s.can_review_provider || s.can_review_client).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Nenhum serviço pendente de avaliação</p>
              </div>
            ) : (
              completedServices
                .filter(service => service.can_review_provider || service.can_review_client)
                .map((service) => (
                  <div key={service.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{service.title}</h3>
                        <p className="text-sm text-gray-600">
                          Concluído em {formatDate(service.completed_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      {service.can_review_provider && (
                        <button
                          onClick={() => openReviewForm(service, 'client_to_provider')}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Avaliar Prestador
                        </button>
                      )}
                      {service.can_review_client && (
                        <button
                          onClick={() => openReviewForm(service, 'provider_to_client')}
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                        >
                          Avaliar Cliente
                        </button>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  {activeTab === 'received' ? 'Você ainda não recebeu avaliações' : 'Você ainda não fez avaliações'}
                </p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{review.service_title}</h3>
                      <p className="text-sm text-gray-600">
                        {activeTab === 'received' ? `Por ${review.reviewer_name}` : `Para ${review.reviewed_name}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <RatingStars rating={review.rating} showCount={false} size="sm" />
                      <p className="text-xs text-gray-500 mt-1">{formatDate(review.created_at)}</p>
                    </div>
                  </div>

                  {review.comment && (
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md">{review.comment}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Review Form Modal */}
        {showReviewForm && selectedService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <ReviewForm
              title={`Avaliar ${reviewType === 'client_to_provider' ? 'Prestador' : 'Cliente'}`}
              onSubmit={handleReviewSubmit}
              onCancel={() => {
                setShowReviewForm(false);
                setSelectedService(null);
              }}
              isLoading={isSubmitting}
            />
          </div>
        )}
      </div>
    </div>
  );
}
