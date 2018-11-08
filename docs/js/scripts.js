$(document).ready(function () {
  $('#compatibility-table').DataTable({
    "orderFixed": [[ 0, 'asc' ], [ 1, 'asc' ]],
    "paging": false,
    "columnDefs": [
        { "visible": false, "targets": 0 }
    ],
    "drawCallback": function ( settings ) {
        var api = this.api();
        var rows = api.rows( {page:'current'} ).nodes();
        var last=null;

        api.column(0, {page:'current'} ).data().each( function ( group, i ) {
            if ( last !== group ) {
                $(rows).eq( i ).before(
                    '<tr class="group"><td colspan="4">'+group+'</td></tr>'
                );
                last = group;
            }
        } );
    }
  });

  // Order by the grouping
  $('#compatibility-table tbody').on( 'click', 'tr.group', function () {
      var currentOrder = table.order()[0];
      if ( currentOrder[0] === groupColumn && currentOrder[1] === 'asc' ) {
          table.order( [ groupColumn, 'desc' ] ).draw();
      }
      else {
          table.order( [ groupColumn, 'asc' ] ).draw();
      }
  } );
});
