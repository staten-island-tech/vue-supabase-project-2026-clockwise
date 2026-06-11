<template>
  <div>
    <NuxtPage />
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
export function useTransactions() {
  const transactions = ref([]);
  const error = ref(null);
  const supabase = useSupabaseClient();

  onMounted(async () => {
    const { data, error: err } = await supabase
      .from("transactions")
      .select("*");
    if (err) error.value = err.message;
    else transactions.value = data;
  });

  return { transactions, error };
}
</script>
